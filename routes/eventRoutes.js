// i will write in next commit --😁😁😁



// Scrapes all posts from the last 15 days regardless of last run time
router.post("/scrape/trigger", async (req, res) => {
  const since15Days = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  res.json({ message: "Forced scrape started — fetching posts from the last 15 days" });
  runScrapeJob({ force: true, sinceDate: since15Days }); // fire-and-forget
});

export default router;
