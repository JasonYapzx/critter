chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (tab.id == null) {
      throw new Error("tab has no id");
    }

    const existing = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: () => typeof window.Crit !== "undefined",
    });

    const alreadyLoaded = existing[0]?.result === true;

    if (!alreadyLoaded) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["crit.js"],
        world: "MAIN",
      });
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: () => window.Crit.toggle(),
    });
  } catch (error) {
    console.warn("critter: inject failed", tab.url, error);
  }
});
