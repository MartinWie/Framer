![Framer logo](https://github.com/MartinWie/Framer/blob/main/Framer_logo.png)

# Framer
A chrome extension that lets the user drop X-Frame-Options and Content-Security-Policy HTTP response headers for special sites, allowing advanced development and pages to be iframed.

# Install
[Chrome store](https://chrome.google.com/webstore/detail/framer-make-iframes-possi/adohambhfalbpaenaclmhhjhilmakmoo)

# Usage
1. Install the extension.
2. Add the site you would like to integrate to the extensions management menu.
3. Open a page where you integrated the page you added in the step before
4. profit! :)

---

## Technical words
Some useful information:
This extension is written for chrome manifest v3.
The extension basically drops response headers more specifiy: "x-frame-options" and "content-security-policy".
With manifest v3 we have three options to drop/remove those.
1) Static rules
Define a static rule in the manifest file. Currently, this extension does not use this but I kept the sample in the code, look in the manifest file for a sample.
2) session-scoped rules
Rules added using the updateSessionRules API method are not persisted across Chrome sessions. These rules are backed in memory by Chrome.

```
chrome.declarativeNetRequest.updateSessionRules(options: UpdateRuleOptions): Promise<object>
chrome.declarativeNetRequest.updateSessionRules(options: UpdateRuleOptions, callback?: function): void
```

3) dynamic-scoped rules
Rules added using the updateDynamicRules API method are persisted across both sessions and extension updates.

```
chrome.declarativeNetRequest.updateDynamicRules(options: UpdateRuleOptions): Promise<object>
chrome.declarativeNetRequest.updateDynamicRules(options: UpdateRuleOptions, callback?: function): void
```

Detail about all of them can be found here:
https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/

4) Bonus option for manifest v2

In V2 this was a bit more ease here is the full code for this:

```
let headersToRemove = [
  'content-security-policy',
  'x-frame-options',
];

chrome.webRequest.onHeadersReceived.addListener(
  details => ({
    responseHeaders: details.responseHeaders.filter(header =>
        !headersToRemove.includes(header.name.toLowerCase()))
  }),
  {
    urls: ['<all_urls>']
  },
  ['blocking', 'responseHeaders', 'extraHeaders']);

```

---

## TODO
- TBD
