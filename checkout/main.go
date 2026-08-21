// Command checkout is the demo's Go service: a deliberately out-of-date HTTP handler that
// negotiates a language for the response.
//
// Its dependency is pinned to a version carrying four known vulnerabilities. Two of them are in
// the function this code calls; two are in parts of the library it never touches. That split is
// the point — it is what reachability analysis reports, and what a manifest scanner alone cannot
// tell you.
package main

import (
	"fmt"
	"log"
	"net/http"

	"golang.org/x/text/language"
)

// preferred picks a language from the request's Accept-Language header.
//
// language.ParseAcceptLanguage is the function CVE-2022-32149 and CVE-2021-38561 are about, and
// this is a real call to it, from a handler reachable over the network.
func preferred(header string) string {
	tags, _, err := language.ParseAcceptLanguage(header)
	if err != nil || len(tags) == 0 {
		return "en"
	}
	return tags[0].String()
}

func handler(w http.ResponseWriter, r *http.Request) {
	lang := preferred(r.Header.Get("Accept-Language"))
	fmt.Fprintf(w, "checkout ready (%s)\n", lang)
}

func main() {
	http.HandleFunc("/checkout", handler)
	log.Fatal(http.ListenAndServe(":8081", nil)) //#nosec G114 -- demo sandbox, not a deployment
}
