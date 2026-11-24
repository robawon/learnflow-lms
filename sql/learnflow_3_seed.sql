-- =====================================================================
--  03_seed.sql  |  Study method catalog (university focus) and starter rules.
--  Run after 02_security.sql. Text uses $$...$$ quoting; rules use VALUES so enum casts are automatic.
-- =====================================================================

insert into study_methods (slug, name, description, best_for, min_minutes, steps) values
 ($$pomodoro$$, $$Pomodoro$$, $$Focused 25-minute blocks with 5-minute breaks.$$,
  $$Any task where staying focused is the problem$$, 25,
  $$["25 min focused work","5 min break","Repeat 4 times","15-30 min long break"]$$::jsonb),
 ($$active-recall$$, $$Active recall$$, $$Close the notes and test yourself from memory.$$,
  $$Memorization-heavy topics and quiz prep$$, 30,
  $$["Read the topic once","Close the material","Write or say everything you remember","Check gaps and repeat"]$$::jsonb),
 ($$spaced-rep$$, $$Spaced repetition$$, $$Review material at growing intervals (1, 3, 7, 14 days).$$,
  $$Long-term retention over weeks$$, 20,
  $$["Make flashcards","Review today","Review again after 1, 3, 7, 14 days"]$$::jsonb),
 ($$sq3r$$, $$SQ3R$$, $$Survey, Question, Read, Recite, Review.$$,
  $$Theory and textbook-heavy courses$$, 45,
  $$["Survey headings","Turn headings into questions","Read to answer them","Recite from memory","Review"]$$::jsonb),
 ($$feynman$$, $$Feynman technique$$, $$Explain the concept in simple words to find what you do not understand.$$,
  $$Concepts you only half understand$$, 30,
  $$["Pick a concept","Explain it simply","Find gaps","Go back to the material and simplify again"]$$::jsonb),
 ($$practice$$, $$Practice problems$$, $$Solve problems, then review every mistake.$$,
  $$Math, programming, engineering courses$$, 45,
  $$["Solve a set without notes","Check answers","Log each mistake","Redo the failed ones"]$$::jsonb),
 ($$past-paper$$, $$Past-paper practice$$, $$Timed mock exams under real conditions.$$,
  $$Final stretch before midterms and finals$$, 60,
  $$["Set a timer","Complete a past paper","Mark it","Study the weak areas"]$$::jsonb),
 ($$mind-map$$, $$Mind map / summary sheet$$, $$Organize a broad topic visually on one page.$$,
  $$Broad topics with many connections$$, 30,
  $$["List key ideas","Connect them","Condense to one page","Review the sheet daily"]$$::jsonb),
 ($$group-study$$, $$Group study / teach-back$$, $$Discuss and teach each other the hard parts.$$,
  $$Difficult topics where discussion helps$$, 45,
  $$["Each member picks a subtopic","Teach it to the group","Quiz each other","Note open questions"]$$::jsonb);

-- Starter rules. Columns: method, course_kind, assessment, max_days_left, min_days_left,
-- max_confidence, max_last_score, min_session_min, weight, reason
insert into study_method_rules
  (method_id, course_kind, assessment, max_days_left, min_days_left, max_confidence, max_last_score, min_session_min, weight, reason)
values
 ((select id from study_methods where slug = $$sq3r$$),
   $$theory$$, null, null, 7, 3, null, null, 3,
   $$Theory course with time left and low confidence: structured reading builds understanding first.$$),
 ((select id from study_methods where slug = $$active-recall$$),
   null, $$quiz$$, 5, null, null, null, null, 3,
   $$Quiz within 5 days: testing yourself from memory is the fastest way to prepare.$$),
 ((select id from study_methods where slug = $$practice$$),
   $$programming$$, null, null, null, null, null, null, 3,
   $$Programming skills grow by doing: solve problems, then review your mistakes.$$),
 ((select id from study_methods where slug = $$practice$$),
   $$problem_solving$$, null, null, null, null, null, null, 3,
   $$Problem-solving courses need repetition on varied problems.$$),
 ((select id from study_methods where slug = $$feynman$$),
   null, null, null, null, null, 50, null, 4,
   $$Your last quiz score was low: explaining the topic simply will reveal what you are missing.$$),
 ((select id from study_methods where slug = $$feynman$$),
   null, null, null, null, 2, null, null, 2,
   $$You feel unsure about this topic: explaining it in simple words will show what to fix.$$),
 ((select id from study_methods where slug = $$active-recall$$),
   null, $$assignment$$, null, null, 4, null, null, 1,
   $$Testing yourself from memory helps you apply the topic in your assignment.$$),
 ((select id from study_methods where slug = $$past-paper$$),
   null, $$final$$, 10, null, null, null, 60, 4,
   $$Final exam is close: timed practice builds speed and exposes weak areas.$$),
 ((select id from study_methods where slug = $$mind-map$$),
   $$writing$$, null, null, null, null, null, null, 2,
   $$Writing projects are easier when you organize your ideas visually first.$$),
 ((select id from study_methods where slug = $$pomodoro$$),
   null, null, null, null, null, null, 90, 1,
   $$Long session: split it into focused blocks with breaks.$$);
