import { NgcCookieConsentConfig } from "ngx-cookieconsent";

export const COOKIE_CONFIG:NgcCookieConsentConfig = {
    "enabled": false,
    "cookie": {
      "domain": "lists.magnusson.berlin"
    },
    "position": "top-right",
    "theme": "block",
    "palette": {
      "popup": {
        "background": "#85abe0",
        "text": "#000000",
        "link": "#ffffff"
      },
      "button": {
        "background": "#f1d600",
        "text": "#000000",
        "border": "transparent"
      }
    },
    "type": "info",
    "content": {
      "message": "Diese Webseite nutzt ausschließlich funktionale Cookies, um Sessions zu ermöglichen.",
      "dismiss": "Verstanden",
      "deny": "",
      "link": "Weitere Infos",
      "href": "/cookies",
      "policy": "Cookie Policy"
    }
  };