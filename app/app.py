"""
Intentionally insecure sample service — for exercising Draugr's `sast` control.
DO NOT copy these patterns into real code.
"""
import os
import subprocess
from flask import Flask, request

app = Flask(__name__)


@app.route("/ping")
def ping():
    # sast: OS command injection — user input flows into a shell command.
    host = request.args.get("host", "")
    return os.popen("ping -c1 " + host).read()


@app.route("/run")
def run():
    # sast: subprocess with shell=True and untrusted input.
    cmd = request.args.get("cmd", "")
    return subprocess.check_output(cmd, shell=True)


@app.route("/calc")
def calc():
    # sast: use of eval on user input.
    expr = request.args.get("expr", "0")
    return str(eval(expr))  # noqa: S307


@app.route("/download")
def download():
    # sast (NEW in this PR): path traversal — untrusted filename joined onto a base path
    # and opened directly, so `?file=../../etc/passwd` escapes the intended directory.
    name = request.args.get("file", "")
    with open("/var/data/" + name) as fh:
        return fh.read()


if __name__ == "__main__":
    # sast: binding to all interfaces with debug enabled.
    app.run(host="0.0.0.0", debug=True)
