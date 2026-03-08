module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/files");
  eleventyConfig.addPassthroughCopy("src/resources/slides");
  eleventyConfig.addPassthroughCopy("src/resources/headshots");
  eleventyConfig.addPassthroughCopy("src/admin");

  // Sort events chronologically (earliest first)
  eleventyConfig.addFilter("sortByDate", (events) => {
    return [...events].sort((a, b) => a.date.localeCompare(b.date));
  });

  // Date filters for events
  eleventyConfig.addFilter("isFuture", (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = dateStr.split("-");
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date >= today;
  });

  eleventyConfig.addFilter("dateMonth", (dateStr) => {
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const parts = dateStr.split("-");
    return months[parseInt(parts[1]) - 1];
  });

  eleventyConfig.addFilter("dateDay", (dateStr) => {
    const parts = dateStr.split("-");
    return parseInt(parts[2]);
  });

  eleventyConfig.addFilter("dateDayOfWeek", (dateStr) => {
    const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    const parts = dateStr.split("-");
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return days[date.getDay()];
  });

  eleventyConfig.addFilter("dateYear", (dateStr) => {
    return dateStr.split("-")[0];
  });

  eleventyConfig.addFilter("uniqueYears", (items) => {
    const years = [...new Set(items.map(item => item.date.split("-")[0]))];
    return years.sort().reverse();
  });

  eleventyConfig.addFilter("dateFormatLong", (dateStr) => {
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const parts = dateStr.split("-");
    return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}, ${parts[0]}`;
  });

  eleventyConfig.addFilter("formatEventTime", (event) => {
    if (event.endDate) {
      const startParts = event.date.split("-");
      const endParts = event.endDate.split("-");
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const startMonth = months[parseInt(startParts[1]) - 1];
      const endMonth = months[parseInt(endParts[1]) - 1];
      return `${startMonth} ${parseInt(startParts[2])} ${event.startTime} - ${endMonth} ${parseInt(endParts[2])} ${event.endTime}`;
    }
    return `${event.startTime} - ${event.endTime}`;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
};