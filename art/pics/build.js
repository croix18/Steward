// Steward pictogram set - source of truth. Run: node build.js  -> pics.json
// Every icon is the inner markup for <svg viewBox="0 0 48 48">.
// Style: 3px round line-art in currentColor + accent fills (class="a", coloured by the app's CSS).
const fs = require("fs");
const path = require("path");

const G = (s) =>
  '<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + s + "</g>";
const p = (d) => `<path d="${d}"/>`;
const c = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
const r = (x, y, w, h, rx) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const acc = (el) => el.replace(/^<(\w+)/, '<$1 class="a"');
const solid = (el) => el.replace(/\/>$/, ' fill="currentColor" stroke="none"/>');
// a = accent shapes, o = outline shapes, s = small solid details
const mk = (a, o, s = []) => a.map(acc).join("") + G(o.join("")) + s.map(solid).join("");
const DISC = c(24, 24, 18.5);

const ICONS = [];
const add = (id, label, svg) => ICONS.push([id, label, svg]);

/* ---------- Routine / schedule ---------- */

// hello: open hand, tilted, with a motion arc either side of the fingertips
add(
  "hello",
  "Check in",
  '<g transform="rotate(10 24 26)">' +
    acc(
      p(
        "M12.4 27V10H18V7.5h5.6V9h5.6v4.5h5.6V30c0 6.5-4.5 11.5-11.3 11.5-4.5 0-7.5-2.5-10-6.5l-6-7.5a2.8 2.8 0 0 1 4.3-3.6z"
      )
    ) +
    G(
      p(
        "M12.4 27V12.3a2.8 2.8 0 0 1 5.6 0V9.8a2.8 2.8 0 0 1 5.6 0v1.5a2.8 2.8 0 0 1 5.6 0v4.5a2.8 2.8 0 0 1 5.6 0V30c0 6.5-4.5 11.5-11.3 11.5-4.5 0-7.5-2.5-10-6.5l-6-7.5a2.8 2.8 0 0 1 4.3-3.6zM18 12.5V22M23.6 11v11M29.2 15.5V22M35.6 5.2q3.9 2.3 4.7 6.8M5.5 10.5q-2.4 3.4-1.6 7.9"
          
      )
    ) +
    "</g>"
);

add(
  "warmup",
  "Warm up",
  mk(
    [p("M13 31a11 11 0 0 1 22 0z")],
    [p("M13 31a11 11 0 0 1 22 0M5.5 31h37M24 15v-4M33.4 18.1l2.4-3.3M14.6 18.1l-2.4-3.3M39.2 26.1l3.1-1M8.8 26.1l-3.1-1M15 38.5h18")]
  )
);

add(
  "teacher",
  "With the teacher",
  mk(
    [r(20.5, 7, 22, 19, 3), p("M5.5 41.5V28a5.5 5.5 0 0 1 11 0v13.5z")],
    [
      r(20.5, 7, 22, 19, 3),
      c(11, 14, 4.5),
      p("M5.5 41.5V28a5.5 5.5 0 0 1 11 0v13.5zM26 13.5h11M26 19.5h7M26.5 26L24 41.5M36.5 26L39 41.5"),
    ]
  )
);

add(
  "own",
  "On my own",
  mk(
    [p("M12 32.5v-3a12 8.5 0 0 1 24 0v3z")],
    [c(24, 11, 5), p("M12 32.5v-3a12 8.5 0 0 1 24 0v3M5.5 32.5h37M10.5 32.5V42M37.5 32.5V42")]
  )
);

{
  const two = "M5.5 39.5V30a7.5 7.5 0 0 1 15 0v9.5zM27.5 39.5V30a7.5 7.5 0 0 1 15 0v9.5z";
  add("partner", "With a partner", mk([p(two)], [c(13, 12.5, 4.5), c(35, 12.5, 4.5), p(two)]));
}

add(
  "group",
  "Group work",
  mk(
    [p("M5.5 41.5V27a6 6 0 0 1 12 0v14.5zM30.5 41.5V27a6 6 0 0 1 12 0v14.5zM13 41.5V38a11 10 0 0 1 22 0v3.5z")],
    [
      c(11.5, 11.5, 4),
      c(36.5, 11.5, 4),
      c(24, 18.5, 4.5),
      p("M13 41.5V38a11 10 0 0 1 22 0v3.5zM13 41.5H5.5V27a6 6 0 0 1 12 0v2.9M35 41.5h7.5V27a6 6 0 0 0-12 0v2.9"),
    ]
  )
);

{
  const book = "M24 13.5c-4.5-3-11.5-4-18.5-2.5v25c7-1.5 14-.5 18.5 2.5 4.5-3 11.5-4 18.5-2.5V11c-7-1.5-14-.5-18.5 2.5z";
  add("read", "Read", mk([p(book)], [p(book + "M24 13.5v25M11 19.5h7.5M11 25.5h7.5M29.5 19.5H37M29.5 25.5H37")]));
}

add(
  "write",
  "Write",
  mk(
    [p("M12 24.5l15-15 7.5 7.5-15 15z")],
    [p("M10 34l2-9.5L30.5 6l7.5 7.5L19.5 32zM12 24.5l7.5 7.5M27 9.5l7.5 7.5M9 40q3-3.5 6 0t6 0 6 0 6 0")],
    [p("M10 34l1.3-5.5 4.2 4.2z")]
  )
);

add(
  "math",
  "Math",
  mk(
    [p("M12.5 5.5H24V24H5.5V12.5a7 7 0 0 1 7-7zM24 24h18.5v11.5a7 7 0 0 1-7 7H24z")],
    [
      r(5.5, 5.5, 37, 37, 7),
      p("M10.5 15h9M15 10.5v9M28.5 15h9M11.6 29.6l6.8 6.8M18.4 29.6l-6.8 6.8M28.5 30.5h9M28.5 35.5h9"),
    ]
  )
);

add(
  "words",
  "Words",
  mk(
    [r(5.5, 7, 16, 23, 4), r(26.5, 18, 16, 23, 4)],
    [r(5.5, 7, 16, 23, 4), r(26.5, 18, 16, 23, 4), p("M9.5 25.5l4-13 4 13M11 21h5M31 22.5v14"), c(34.6, 33, 3.6)]
  )
);

{
  const ear = "M20.5 18.5a10.5 10.5 0 0 1 21 0c0 7-6 8.5-6.5 15a5.5 5.5 0 0 1-10 3c-2-5-4.5-11-4.5-18z";
  add(
    "listen",
    "Listen",
    mk([p(ear)], [p(ear + "M26.5 19a4.5 4.5 0 0 1 9 0c0 3.5-4 4-4 8M14.5 16q-3 5.5 0 11M9 11.5q-5 10 0 20")])
  );
}

{
  const front = "M21 18h16.5a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5v5.5L32 36H21a5 5 0 0 1-5-5v-8a5 5 0 0 1 5-5z";
  add(
    "talk",
    "Talk",
    mk(
      [p(front)],
      [p(front + "M30 18v-7a5 5 0 0 0-5-5H10.5a5 5 0 0 0-5 5v8a5 5 0 0 0 5 5v5.5L16 24")],
      [c(23.5, 27, 1.7), c(29.3, 27, 1.7), c(35, 27, 1.7)]
    )
  );
}

{
  const eye = "M5.5 24C11 15 17.5 11.5 24 11.5S37 15 42.5 24C37 33 30.5 36.5 24 36.5S11 33 5.5 24z";
  add("look", "Look", mk([p(eye)], [p(eye), c(24, 24, 6.5)], [c(24, 24, 2.6)]));
}

add(
  "computer",
  "Computer",
  mk(
    [p("M9.5 30.5V11a3 3 0 0 1 3-3h23a3 3 0 0 1 3 3v19.5z")],
    [p("M9.5 30.5V11a3 3 0 0 1 3-3h23a3 3 0 0 1 3 3v19.5M9.5 30.5h29l4 9h-37z")]
  )
);

add(
  "video",
  "Video",
  acc(r(5.5, 8.5, 37, 26, 4)) +
    G(r(5.5, 8.5, 37, 26, 4) + p("M24 34.5V41M16.5 41h15") + '<path d="M20.5 16l9.5 5.5-9.5 5.5z" fill="currentColor"/>')
);

add(
  "test",
  "Quiz",
  mk(
    [r(9.5, 8.5, 29, 34, 4), r(18, 5.5, 12, 6, 2)],
    [
      p("M18 8.5h-4.5a4 4 0 0 0-4 4v26a4 4 0 0 0 4 4h21a4 4 0 0 0 4-4v-26a4 4 0 0 0-4-4H30M16 21.5l4 4 8-8.5M16 32h16M16 37h10"),
      r(18, 5.5, 12, 6, 2),
    ]
  )
);

add(
  "cards",
  "Flash cards",
  mk(
    [r(5.5, 17, 30, 22.5, 3.5)],
    [
      r(5.5, 17, 30, 22.5, 3.5),
      p("M12.5 17v-4.5A3.5 3.5 0 0 1 16 9h23a3.5 3.5 0 0 1 3.5 3.5V28a3.5 3.5 0 0 1-3.5 3.5h-3.5M13 28.2h15"),
    ]
  )
);

add(
  "journal",
  "Journal",
  mk(
    [r(11.5, 5.5, 29, 37, 4)],
    [r(11.5, 5.5, 29, 37, 4), p("M7 13h8M7 20.5h8M7 27.5h8M7 35h8M27.5 5.5V19l4-3.5 4 3.5V5.5")]
  )
);

{
  const tip = "M21.5 21.5C14 22.5 9.5 30 8.5 39.5 18 38.5 25.5 34 26.5 26.5";
  add(
    "draw",
    "Draw",
    mk(
      [p("M4.5 37.5c0-5 5-7.5 11-6.5 6 1 10.5-2.5 16-.5s7 11.5-1 11.5h-19c-4.5 0-7-1.5-7-4.5z"), p(tip + "z")],
      [p("M21.5 21.5L36.2 6.8a3.5 3.5 0 0 1 5 5L26.5 26.5M21.5 21.5l5 5" + tip)]
    )
  );
}

add(
  "game",
  "Game",
  '<g transform="rotate(-10 24 24)">' +
    acc(r(8, 8, 32, 32, 7)) +
    G(r(8, 8, 32, 32, 7)) +
    [
      [16.5, 16.5],
      [31.5, 16.5],
      [24, 24],
      [16.5, 31.5],
      [31.5, 31.5],
    ]
      .map(([x, y]) => solid(c(x, y, 2.4)))
      .join("") +
    "</g>"
);

add(
  "library",
  "Library",
  mk(
    [r(6.5, 12, 9, 28.5, 2), p("M24.5 15.1L32 12.4l9.2 25.4-7.5 2.7z")],
    [
      r(6.5, 12, 9, 28.5, 2),
      r(15.5, 7, 9, 33.5, 2),
      p("M24.5 15.1L32 12.4l9.2 25.4-7.5 2.7zM6.5 33h9M15.5 14.5h9M26.3 20.2l7.5-2.7"),
    ]
  )
);

{
  const spark = "M36.5 6q.7 4.3 5 5-4.3.7-5 5-.7-4.3-5-5 4.3-.7 5-5z";
  add(
    "clean",
    "Clean up",
    mk(
      [p("M9.5 26.5l2 16h19l2-16z"), p(spark)],
      [r(6, 21, 30, 5.5, 2), p("M9.5 26.5l2 16h19l2-16M17.5 34h7"), p(spark)],
      [p("M23.5 6.5q.5 3 3.5 3.5-3 .5-3.5 3.5-.5-3-3.5-3.5 3-.5 3.5-3.5z")]
    )
  );
}

{
  const body = "M9.5 24c0-7 5-11 14.5-11s14.5 4 14.5 11v14.5a4 4 0 0 1-4 4h-21a4 4 0 0 1-4-4z";
  add(
    "pack",
    "Pack up",
    mk([p(body)], [p(body + "M19 13.5v-4a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v4M15.5 42.5V32a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v10.5M17.5 21.5h13")])
  );
}

{
  const bodies = "M7 40.5V24a4 4 0 0 1 8 0v16.5M20 40.5V24a4 4 0 0 1 8 0v16.5M33 40.5V24a4 4 0 0 1 8 0v16.5";
  add(
    "lineup",
    "Line up",
    mk([p(bodies)], [c(11, 11.5, 3.5), c(24, 11.5, 3.5), c(37, 11.5, 3.5), p(bodies + "M5.5 40.5h37")])
  );
}

add(
  "bye",
  "Goodbye",
  mk(
    [p("M5.5 5.5L17 10v28L5.5 42.5z")],
    [p("M5.5 5.5H25v37H5.5zL17 10v28L5.5 42.5M30 24h12M36.5 18l6 6-6 6")],
    [c(13.3, 24.5, 1.7)]
  )
);

/* ---------- Needs / breaks ---------- */

add(
  "break",
  "Break",
  mk(
    [p("M13 29V12a5 5 0 0 1 5-5h12a5 5 0 0 1 5 5v17z")],
    [
      p(
        "M13 24.5V12a5 5 0 0 1 5-5h12a5 5 0 0 1 5 5v12.5M5.5 24.5a3.8 3.8 0 0 1 7.5 0V29h22v-4.5a3.8 3.8 0 0 1 7.5 0V35a2.5 2.5 0 0 1-2.5 2.5H8A2.5 2.5 0 0 1 5.5 35zM10.5 37.5V41M37.5 37.5V41"
      ),
    ]
  )
);

{
  const leaf = "M11 33C7 19 19 7 36 7c1 17-11 30-25 26z";
  add("calm", "Calm", mk([p(leaf)], [p(leaf + "M7 38.5L26 18M23 40q4.5-4 9 0t9 0")]));
}

// move: figure stretching, both arms up
{
  const body = "M16.5 41.5v-14a7.5 7.5 0 0 1 15 0v14z";
  add("move", "Move", mk([p(body)], [c(24, 10, 4.5), p(body + "M18.5 22.4l-9-13.9M29.5 22.4l9-13.9")]));
}

{
  const wave = "M12.5 28q5.7-3.5 11.5 0t11.5 0";
  add(
    "water",
    "Water",
    mk(
      [p(wave + "v10.5a4 4 0 0 1-4 4h-15a4 4 0 0 1-4-4z")],
      [
        r(17, 5.5, 14, 5.5, 2),
        p("M19 11v2.5c0 3.5-6.5 4-6.5 9.5v15.5a4 4 0 0 0 4 4h15a4 4 0 0 0 4-4V23c0-5.5-6.5-6-6.5-9.5V11" + wave),
      ]
    )
  );
}

{
  const apple =
    "M24 17c-3-3.5-11-4.5-15 1-4 5.5-3 15 2.5 21 3.5 4 9 4 12.5 2 3.5 2 9 2 12.5-2 5.5-6 6.5-15.5 2.5-21-4-5.5-12-4.5-15-1z";
  const leaf = "M24 11c0-4 4-5.5 9-5.5 0 4.5-4 6.5-9 5.5z";
  add("snack", "Snack", mk([p(apple), p(leaf)], [p(apple + "M24 17v-6"), p(leaf)]));
}

add(
  "lunch",
  "Lunch",
  mk([c(24, 24, 8.5)], [c(24, 24, 8.5), p("M5.5 7v7a2.8 2.8 0 0 0 5.6 0V7M8.3 16.8V41M41 41V7c-3.5 3-4 9.5-4 15h4")])
);

add(
  "restroom",
  "Restroom",
  mk(
    [r(11.5, 5.5, 25, 37, 2)],
    [r(11.5, 5.5, 25, 37, 2), c(24, 14, 3.5), p("M18.5 34.5V28a5.5 5.5 0 0 1 11 0v6.5zM5.5 42.5h37")]
  )
);

add(
  "music",
  "Music",
  mk(
    [r(5.5, 25, 10, 16, 4), r(32.5, 25, 10, 16, 4)],
    [r(5.5, 25, 10, 16, 4), r(32.5, 25, 10, 16, 4), p("M10.5 25v-3.5a13.5 13.5 0 0 1 27 0V25")]
  )
);

{
  const spk = "M6.5 18.5H13l11-8.5v28l-11-8.5H6.5z";
  add("quiet", "Quiet work", mk([p(spk)], [p(spk + "M29.5 18l12 12M41.5 18l-12 12")]));
}

// help: a raised arm from the bottom edge - small open hand on a long (accent) sleeve, "!" beside it.
// Deliberately unlike "hello": upright, hand left unfilled, long arm, no motion arcs.
add(
  "help",
  "Ask for help",
  mk(
    [p("M16 28.5h13.5v14H16z")],
    [
      p(
        "M15.5 28.5c-1-.6-1.8-1.5-2.5-2.5l-4.5-6a2.3 2.3 0 0 1 3.6-2.9l1.4 1.6V9.8a2.3 2.3 0 0 1 4.6 0v-2a2.3 2.3 0 0 1 4.6 0v1a2.3 2.3 0 0 1 4.6 0v3.5a2.3 2.3 0 0 1 4.6 0V23c0 2.3-.7 4.2-2 5.5M13.5 28.5H32M16 28.5v14M29.5 28.5v14M18.1 10v9M22.7 8.5V19M27.3 12.5V19M40 6.5v10"
      ),
    ],
    [c(40, 23, 2)]
  )
);

add(
  "timer",
  "Timer",
  mk(
    [p("M14.5 40c0-5.5 5-7.5 9.5-7.5s9.5 2 9.5 7.5zM15.5 12.5h17c-1 5-6.5 6-8.5 9.5-2-3.5-7.5-4.5-8.5-9.5z")],
    [p("M9.5 6.5h29M9.5 41.5h29M12.5 6.5v5c0 7 9 8 9 12.5s-9 5.5-9 12.5v5M35.5 6.5v5c0 7-9 8-9 12.5s9 5.5 9 12.5v5")]
  )
);

add(
  "choice",
  "Choice time",
  mk(
    [r(16, 5.5, 16, 16, 3.5)],
    [r(16, 5.5, 16, 16, 3.5), r(5.5, 27, 15.5, 15.5, 3.5), r(27, 27, 15.5, 15.5, 3.5), p("M20 13.5l3 3 5.5-6")]
  )
);

add(
  "outside",
  "Outside",
  mk(
    [c(15.5, 23, 10), c(34, 14, 4)],
    [
      c(15.5, 23, 10),
      c(34, 14, 4),
      p("M15.5 25v16.5M15.5 32.5l4.5-4.5M6 41.5h36M34 5.5v.1M34 22.5v.1M25.5 14h.1M42.3 14h.1M28 8l.1.1M40 8l.1.1M28 20l.1.1M40 20l.1.1"),
    ]
  )
);

{
  const bub = "M12.5 5.5h23a7 7 0 0 1 7 7v16a7 7 0 0 1-7 7h-14l-8 7v-7h-1a7 7 0 0 1-7-7v-16a7 7 0 0 1 7-7z";
  add(
    "question",
    "Review",
    mk([p(bub)], [p(bub + "M19.5 16.5a4.8 4.8 0 1 1 7.3 4.1c-1.8 1.1-2.5 2-2.5 3.9")], [c(24.3, 29.6, 1.9)])
  );
}

add("done", "Done", mk([DISC], [DISC, p("M15 24.5l6.5 6.5 12-13.5")]));

/* ---------- Tokens ---------- */

{
  const star = "M24 6.5l5.9 10.9 12.2 2.2-8.6 9 1.7 12.3L24 35.5l-11.2 5.4 1.7-12.3-8.6-9 12.2-2.2z";
  add("star", "Star", mk([p(star)], [p(star)]));
}

add(
  "coin",
  "Coin",
  mk([DISC], [DISC, c(24, 24, 12.5)], [p("M24 17.8l1.6 4.2 4.6.3-3.5 2.9 1.1 4.4-3.8-2.5-3.8 2.5 1.1-4.4-3.5-2.9 4.6-.3z")])
);

{
  const heart = "M24 40.5C10 31 5.5 23.5 5.5 16.5a9.5 9.5 0 0 1 18.5-3 9.5 9.5 0 0 1 18.5 3c0 7-4.5 14.5-18.5 24z";
  add("heart", "Heart", mk([p(heart)], [p(heart)]));
}

{
  const paw =
    "M24 23.5c-6 0-11 6-11 12 0 4 3 5.5 6 5.5 2 0 3-1 5-1s3 1 5 1c3 0 6-1.5 6-5.5 0-6-5-12-11-12z" +
    "M6.5 23a3.5 4.5 0 1 0 7 0 3.5 4.5 0 1 0-7 0zM14.2 13a3.8 5 0 1 0 7.6 0 3.8 5 0 1 0-7.6 0zM26.2 13a3.8 5 0 1 0 7.6 0 3.8 5 0 1 0-7.6 0zM34.5 23a3.5 4.5 0 1 0 7 0 3.5 4.5 0 1 0-7 0z";
  add("paw", "Paw", mk([p(paw)], [p(paw)]));
}

{
  const bolt = "M20 5.5h12l-5 13.5h11L16 42.5 20.5 27H10z";
  add("bolt", "Bolt", mk([p(bolt)], [p(bolt)]));
}

// anchor: line anchor on an accent medallion (the disc is what gets "coloured in")
add(
  "anchor",
  "Anchor",
  mk([c(24, 24, 20)], [c(24, 10, 4.5), p("M24 14.5v26M15.5 20.5h17M9 26.5c0 8 6.5 14 15 14s15-6 15-14M7 31l2-4.5 4.5 2.5M41 31l-2-4.5-4.5 2.5")])
);

{
  const hand =
    "M15 41.5V23c4-3.5 7-8.5 8-12.5.6-2.5 2-4 4-4 2.7 0 4 2.2 4 5 0 2.5-.5 5-1.5 7.5h7.5c3.1 0 5.4 2.6 4.8 5.6l-1.9 12c-.5 2.9-2.8 4.9-5.7 4.9z";
  const cuff = "M15 23H8.5A2.5 2.5 0 0 0 6 25.5V39a2.5 2.5 0 0 0 2.5 2.5H15";
  add("thumb", "Thumbs up", mk([p(hand), p(cuff + "z")], [p(hand + cuff)]));
}

{
  const gem = "M14 6.5h20l8.5 11L24 41.5 5.5 17.5z";
  add("gem", "Gem", mk([p(gem)], [p(gem + "M5.5 17.5h37M16.5 17.5L24 6.5l7.5 11")]));
}

/* ---------- Rewards extras ---------- */

{
  const cup = "M14 6.5h20V19a10 10 0 0 1-20 0zM18 41.5h12l-1.5-6h-9z";
  add(
    "trophy",
    "Prize",
    mk([p(cup)], [p(cup + "M24 29v6.5M15 41.5h18M14 11H8.5a3 3 0 0 0-3 3c0 5 3.5 8 8.9 8.8M34 11h5.5a3 3 0 0 1 3 3c0 5-3.5 8-8.9 8.8")])
  );
}

{
  const tk = "M9.5 11h29a4 4 0 0 1 4 4v5a4 4 0 0 0 0 8v5a4 4 0 0 1-4 4h-29a4 4 0 0 1-4-4v-5a4 4 0 0 0 0-8v-5a4 4 0 0 1 4-4z";
  add(
    "ticket",
    "Ticket",
    mk([p(tk)], [p(tk + "M30.5 16v1M30.5 23.5v1M30.5 31v1")], [p("M18.5 18.5l1.4 3.6 3.8.2-2.9 2.4.9 3.7-3.2-2-3.2 2 .9-3.7-2.9-2.4 3.8-.2z")])
  );
}

// phone ("Free time"): hand-held game controller
{
  const pad =
    "M14 11.5h20c5 0 8.5 4.5 8.5 11v7c0 4.5-2 7.5-5 7.5-2.5 0-4-1.5-5.5-4.5l-1-2H17l-1 2c-1.5 3-3 4.5-5.5 4.5-3 0-5-3-5-7.5v-7c0-6.5 3.5-11 8.5-11z";
  add("phone", "Free time", mk([p(pad)], [p(pad + "M15.5 18v7M12 21.5h7")], [c(30, 24, 2), c(35.5, 19, 2)]));
}

{
  const paper = "M5.5 9.5a3 3 0 0 1 3-3h7L22 13v25.5a3 3 0 0 1-3 3H8.5a3 3 0 0 1-3-3z";
  add(
    "art",
    "Art",
    mk([p(paper)], [p(paper + "M15.5 6.5V13H22M30.8 34.8L38 7.5M38.2 34.8L31 7.5"), c(29.5, 37.5, 3), c(39.5, 37.5, 3)])
  );
}

/* ---------- Feelings ---------- */

add("feel-great", "Great", mk([DISC], [DISC, p("M14 21a3.5 3.5 0 0 1 7 0M27 21a3.5 3.5 0 0 1 7 0M15 27.5h18a9 9 0 0 1-18 0z")]));
add("feel-good", "Okay", mk([DISC], [DISC, p("M16 28.5q8 7 16 0")], [c(17.5, 20, 2.3), c(30.5, 20, 2.3)]));
// tired: heavy half-closed lids and a small yawn
add(
  "feel-tired",
  "Tired",
  mk(
    [DISC],
    [DISC, p("M12.5 21.5l9-1.5M35.5 21.5l-9-1.5"), '<ellipse cx="24" cy="33" rx="3" ry="3.5"/>'],
    [p("M13.8 21.5a3.3 3.3 0 0 0 6.6-1.1zM34.2 21.5a3.3 3.3 0 0 1-6.6-1.1z")]
  )
);
add(
  "feel-worried",
  "Worried",
  mk([DISC], [DISC, p("M13 17l7-3.5M35 17l-7-3.5M17 32.5q3.5-4 7 0t7 0")], [c(17.5, 22.5, 2.3), c(30.5, 22.5, 2.3)])
);
add(
  "feel-upset",
  "Upset",
  mk([DISC], [DISC, p("M13 14l7.5 4M35 14l-7.5 4M16 34.5q8-8 16 0")], [c(17.5, 23, 2.3), c(30.5, 23, 2.3)])
);

/* ---------- write ---------- */
const out = {};
for (const [id, label, svg] of ICONS) out[id] = { label, svg };
fs.writeFileSync(path.join(__dirname, "pics.json"), JSON.stringify(out, null, 1) + "\n");
console.log(ICONS.length + " icons written");
