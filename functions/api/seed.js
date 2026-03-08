// One-time endpoint to migrate existing JSON data into D1
// POST /api/seed — run once, then delete this file

export async function onRequestPost(context) {
  const { DB } = context.env;

  // Existing events from events.json
  const events = [
    { id: "e001", title: "Quarterly ISC2 Chapter Meeting (Q4)", date: "2026-12-05", end_date: null, start_time: "10:00 AM", end_time: "2:00 PM", location: "Stetson Tampa Law Center, 1700 North Tampa Street, Tampa, FL 33602", type: "chapter", description: "Officer updates, guest presentations on current cybersecurity topics, networking lunch, and a second speaking session. Open to members and guests.", url: null, image: null },
    { id: "e002", title: "Quarterly ISC2 Chapter Meeting (Q3)", date: "2026-09-12", end_date: null, start_time: "10:00 AM", end_time: "2:00 PM", location: "Stetson Tampa Law Center, 1700 North Tampa Street, Tampa, FL 33602", type: "chapter", description: "Officer updates, guest presentations on current cybersecurity topics, networking lunch, and a second speaking session. Open to members and guests.", url: null, image: null },
    { id: "e003", title: "BSides Tampa 2026", date: "2026-05-15", end_date: "2026-05-16", start_time: "8:00 AM", end_time: "5:00 PM", location: "USF Marshall Center", type: "community", description: "\"Unlucky 13.\" Tempt fate at the 13th annual BSides Tampa. Friday features low-cost training courses and early check-in; Saturday is the main event with talks, workshops, CTF competitions, and networking with Tampa Bay's security community. Two $500 student scholarships available. Apply by April 1!", url: "https://bsidestampa.net", image: null },
    { id: "e004", title: "Quarterly ISC2 Chapter Meeting (Q1)", date: "2026-03-07", end_date: null, start_time: "10:00 AM", end_time: "2:00 PM", location: "Stetson University", type: "chapter", description: "Kick off 2026 with officer updates, guest presentations, networking lunch, and a second speaking session. Open to members and guests.", url: "https://lnkd.in/eCw8FZqx", image: null },
    { id: "e005", title: "ISC2 2025 Q4 Holiday Party", date: "2025-12-06", end_date: null, start_time: "10:00 AM", end_time: "2:00 PM", location: "Stetson University", type: "holiday", description: "End-of-year get-together. Food, drinks, and a look back at what we pulled off in 2025.", url: null, image: null },
    { id: "e006", title: "Quarterly ISC2 Chapter Meeting (Q3)", date: "2025-09-20", end_date: null, start_time: "10:00 AM", end_time: "2:00 PM", location: "Stetson University", type: "chapter", description: "Officer updates, guest presentations on current cybersecurity topics, networking lunch, and a second speaking session.", url: null, image: null },
    { id: "e007", title: "BSides Tampa 2025", date: "2025-05-16", end_date: "2025-05-17", start_time: "8:00 AM", end_time: "10:00 PM", location: "USF Marshall Center", type: "community", description: "Two days of security talks, workshops, CTF, and a good crowd. If you missed it, you missed it.", url: "https://bsidestampa.net", image: null },
    { id: "e008", title: "Quarterly ISC2 Chapter Meeting (Q1)", date: "2025-02-22", end_date: null, start_time: "10:00 AM", end_time: "2:00 PM", location: "Stetson University", type: "chapter", description: "Officer updates, guest presentations, networking lunch, and a second speaking session. Open to members and guests.", url: null, image: null },
    { id: "e009", title: "Quarterly ISC2 Chapter Meeting (Q3)", date: "2024-07-20", end_date: null, start_time: "10:00 AM", end_time: "2:00 PM", location: "Stetson University", type: "chapter", description: "Officer updates, guest presentations on current cybersecurity topics, networking lunch, and a second speaking session.", url: null, image: null }
  ];

  // Existing presentations from presentations.json
  const presentations = [
    { id: "p001", title: "Threat Modeling and Predictive Analytics in the Age of Quantum Computing", speaker: "Mrunal Gangrade", linkedin: "https://www.linkedin.com/in/mrunal-gangrade-8087121b5/", date: "2026-03-07", event: "Q1 2026 Chapter Meeting", description: "The presentation argues that traditional reactive security is insufficient against emerging quantum computing threats, particularly \"Harvest Now, Decrypt Later\" attacks, and proposes a unified framework combining quantum-aware threat modeling, ML-driven predictive analytics, and automated adaptive defense to build a continuously learning security posture that can survive the cryptographic transition ahead.", slides: "https://docs.google.com/presentation/d/16ufXSQo7SbDvBU6_PnOcBVW8hA1YnnVz/edit?usp=sharing&ouid=101030355156182792261&rtpof=true&sd=true", video: null, image: "/resources/headshots/MrunalGangrade.jpg", tags: ["cryptography", "quantum"] },
    { id: "p002", title: "LLM Abliteration 101: Hands-On Unrestricted AI, Local Models", speaker: "Joshua Grose", linkedin: "https://www.linkedin.com/in/joshuagrose/", date: "2026-03-07", event: "Q1 2026 Chapter Meeting", description: "This session breaks down what LLM Abliteration is, shows how to do it with open source tools, and includes a live demo comparing real outcomes. You'll learn how to run unrestricted models locally and leave with practical ideas on how these techniques can be used for meaningful security research and education.", slides: "https://docs.google.com/presentation/d/1cxLcaMNQxD4UjhR_56vWkkcd5vi9x_gl/", video: null, image: "/resources/headshots/JoshuaGrose.jpg", tags: ["AI/ML", "red team", "offensive security"] },
    { id: "p003", title: "Q1 Tampa Chapter Updates", speaker: "", linkedin: null, date: "2026-03-07", event: "Q1 2026 Chapter Meeting", description: "Q1 Tampa Chapter Update Presentation by chapter leadership", slides: "https://docs.google.com/presentation/d/1oDhOX5_sW8kXJ2_zDYui3KAkxtiqtZfCqG797qiYtZQ/", video: null, image: null, tags: ["AI/ML", "red team", "offensive security"] }
  ];

  // Insert events
  for (const e of events) {
    await DB.prepare(
      `INSERT OR IGNORE INTO events (id, title, date, end_date, start_time, end_time, location, type, description, url, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(e.id, e.title, e.date, e.end_date, e.start_time, e.end_time, e.location, e.type, e.description, e.url, e.image).run();
  }

  // Insert presentations
  for (const p of presentations) {
    await DB.prepare(
      `INSERT OR IGNORE INTO presentations (id, title, speaker, linkedin, date, event, description, slides, video, image, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(p.id, p.title, p.speaker, p.linkedin, p.date, p.event, p.description, p.slides, p.video, p.image, JSON.stringify(p.tags)).run();
  }

  return Response.json({ seeded: { events: events.length, presentations: presentations.length } });
}
