"""
Sample service — hardened version.

This is the "after" for the SAST-fix example PR: the command injection, eval, shell=True,
and debug/all-interfaces issues are removed, so Draugr's `sast` findings for this file clear.
"""
import ipaddress
import subprocess

from flask import Flask, abort, request

app = Flask(__name__)


@app.route("/ping")
def ping():
    # Validate input is an IP address, then exec without a shell (argument list, not a string).
    host = request.args.get("host", "")
    try:
        ipaddress.ip_address(host)
    except ValueError:
        abort(400, "invalid host")
    result = subprocess.run(
        ["ping", "-c1", host], capture_output=True, text=True, check=False
    )
    return result.stdout


@app.route("/calc")
def calc():
    # Arithmetic without eval: sum a fixed set of integer query params.
    total = 0
    for value in request.args.getlist("n"):
        try:
            total += int(value)
        except ValueError:
            abort(400, "n must be an integer")
    return str(total)


if __name__ == "__main__":
    # Bind to loopback, no debug server in production.
    app.run(host="127.0.0.1", port=5000)
