import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

if (document.querySelector('meta[name="ghostwriter-offline"]')) {
  void import("./offline")
    .then(({ mountOfflineRoom }) => mountOfflineRoom())
    .catch(() => {
      const heading = document.querySelector("main h1");
      const message = document.querySelector("main p");
      if (heading) heading.textContent = "The writing room could not open";
      if (message)
        message.textContent =
          "Reconnect to the internet and try again. Do not clear this device’s saved data; your saved books may still be here.";
    });
} else {
  hydrateRoot(document, <StartClient />);
}
