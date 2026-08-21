# Grind 1 v2 — stresstestresultat, 2026-08-22

**Kört:** `scripts/grind1-boardpatience-sim-v2.ts`, 100 seedade körningar × 3 säsonger vardera för `club_skutskar` och `club_heros` (Jacobs order — kör FÖRE koefficienterna låses, rapportera fördelningen).

**Resultat i korthet:** Skutskär 57/100 (57%) sparkade inom 3 säsonger, Heros 100/100 (100%). Båda högt över kalibreringsmålet ("icke-noll men rimlig avskedsrisk"). Alla avsked klassificerade `boardPatience<=15` — ingen bankruptcy-förväxling denna gång (klassificeringsbuggen från v1 är fixad, se scriptets `classifyFiredReason`).

**Rotorsak (Codes diagnos, inte en åtgärd):** förlustsvit-tillägget (LESSONS: streak≥3 → -3/omgång, streak≥5 → -8/omgång) applicerades **varje omgång sviten fortsätter**, inte en gång vid tröskelpassage — exakt så som Jacobs egen illustrativa handräkning (5-matchers-exemplet, 0+0-3-3-6=-12) definierade det, och exakt så koden byggdes. Det problemet är inte formeln i sig utan att verkliga sviter under "normalt spel" (autoSelectLineup/advanceToNextEvent) blir MYCKET längre än fem — data nedan visar sviter på 7, 10, 13, 16, ända upp till 19 matcher i en och samma säsong. En 16-matchers svit betalar -8/omgång i 12 av de 16 omgångarna (svit≥5) plus -1.5 bas per förlust — omkring -120 bara från den sviten, i en och samma säsong. Det är detta som driver 57%/100%, inte primärt säsongsslutets positionsterm.

**Sidofynd:** både Skutskär och Heros slutar på EXAKT samma tabellplats (9 respektive 4) i alla 100 körningar, oavsett seed — normalt-spel-motorn ger nästan ingen variation i SLUTPLACERING för dessa klubbar, bara i VÄGEN dit (sviternas längd/placering). Det förstärker att sviten, inte positionen, är det som just nu avgör utfallet.

**Väntar på:** Jacobs dom om nästa koefficientrunda — options som INTE redan avgjorda av Code (Code har inte ändrat något efter detta test): korta av sviten till en engångskostnad vid tröskelpassage istf per omgång, ett tak på hur mycket en enskild svit kan kosta totalt per säsong, eller lägre magnituder på -3/-8. Rapporterat, inget byggt efter denna körning.

---

=== Grind 1 v2 — boardPatience mot avskedströskeln, U1 andra halvan (Jacobs dom 2026-08-22) ===

100 seedade körningar × 3 säsonger = 300 säsongs-sampel per klubb.

--- club_skutskar (100 giltiga körningar, 0 kraschade) ---
Sparkad inom 3 säsonger: 57/100 (57.0%)
Avskedsorsak-fördelning: {"boardPatience<=15":57}
Avsked per säsong: {"1":4,"2":28,"3":25}
boardPatience: min=0.0 max=100.0 snitt=40.0 (över alla säsongs-sampel)
Patience-histogram (band om 10): 0-9:42 10-19:27 20-29:35 30-39:30 40-49:24 50-59:38 60-69:31 70-79:22 80-89:9 90-99:6
Klubbkassa: min=-1004154 snitt=-80654
  seed=30000: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 54.5,0.0 — max förlustsvit/säsong 2,7 — kassa -103961,-506814
  seed=30004: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 48.0,22.5,0.0 — max förlustsvit/säsong 4,3,6 — kassa -29861,-470517,-777176
  seed=30006: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 17.0,0.0 — max förlustsvit/säsong 7,7 — kassa 101493,-80349
  seed=30007: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 63.5,70.5,1.0 — max förlustsvit/säsong 3,2,12 — kassa 120961,53072,-289958
  seed=30010: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 50.5,0.0 — max förlustsvit/säsong 3,8 — kassa -119480,-575421
  seed=30011: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 51.5,33.0,10.5 — max förlustsvit/säsong 4,4,3 — kassa 77947,-201256,-430731
  seed=30012: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 50.0,13.5 — max förlustsvit/säsong 4,4 — kassa -61585,-366894
  seed=30014: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 41.0,19.0,13.0 — max förlustsvit/säsong 3,5,3 — kassa 86332,-110955,-233087
  seed=30015: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 65.5,20.0,0.0 — max förlustsvit/säsong 4,6,5 — kassa 269880,102281,-87772
  seed=30017: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 66.5,21.0,0.0 — max förlustsvit/säsong 3,7,6 — kassa 303032,100884,-134273
  seed=30018: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 32.5,3.5 — max förlustsvit/säsong 6,4 — kassa 76671,-360063
  seed=30020: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 62.5,9.5 — max förlustsvit/säsong 4,6 — kassa -15686,-645097
  seed=30022: sparkad säsong 1 (boardPatience<=15) — placeringar 9 — patience 4.0 — max förlustsvit/säsong 7 — kassa -266993
  seed=30024: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 48.0,23.0,5.0 — max förlustsvit/säsong 4,4,4 — kassa -80546,-563441,-844411
  seed=30025: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 25.0,10.0 — max förlustsvit/säsong 5,4 — kassa -100535,-625457
  seed=30026: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 26.0,8.0 — max förlustsvit/säsong 5,5 — kassa 131638,25535
  seed=30028: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 28.5,7.5 — max förlustsvit/säsong 7,3 — kassa 221621,-75501
  seed=30029: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 41.5,40.5,15.0 — max förlustsvit/säsong 6,3,5 — kassa 85648,-152193,-139917
  seed=30030: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 66.5,14.0 — max förlustsvit/säsong 3,7 — kassa -29188,-530186
  seed=30031: sparkad säsong 1 (boardPatience<=15) — placeringar 9 — patience 11.5 — max förlustsvit/säsong 7 — kassa 61753
  seed=30032: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 53.0,21.0,5.0 — max förlustsvit/säsong 3,7,5 — kassa -34444,-71859,-272565
  seed=30036: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 39.0,0.0 — max förlustsvit/säsong 4,8 — kassa -4103,-491795
  seed=30037: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 54.5,34.5,15.0 — max förlustsvit/säsong 4,4,3 — kassa 136738,-249596,-468653
  seed=30039: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 44.0,30.0,0.0 — max förlustsvit/säsong 4,3,4 — kassa 8345,-336173,-655723
  seed=30040: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 74.0,68.5,12.5 — max förlustsvit/säsong 3,3,5 — kassa 157746,-79180,-410508
  seed=30041: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 73.5,34.5,7.0 — max förlustsvit/säsong 3,4,4 — kassa 189821,-218492,-555777
  seed=30042: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 22.0,0.0 — max förlustsvit/säsong 5,5 — kassa -13064,-169064
  seed=30044: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 27.5,9.5 — max förlustsvit/säsong 4,4 — kassa 77832,-159638
  seed=30045: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 27.0,30.0,0.0 — max förlustsvit/säsong 6,3,8 — kassa 91207,-171851,-448167
  seed=30047: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 25.0,0.0 — max förlustsvit/säsong 7,5 — kassa 10866,-349537
  seed=30048: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 39.5,6.0 — max förlustsvit/säsong 6,5 — kassa 311541,69760
  seed=30049: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 32.0,1.0 — max förlustsvit/säsong 4,7 — kassa 6097,-426835
  seed=30051: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 56.5,14.5 — max förlustsvit/säsong 2,7 — kassa -4129,-325340
  seed=30053: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 41.5,0.0 — max förlustsvit/säsong 4,5 — kassa 148681,-177388
  seed=30054: sparkad säsong 1 (boardPatience<=15) — placeringar 9 — patience 12.0 — max förlustsvit/säsong 12 — kassa 131304
  seed=30055: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 23.0,11.5 — max förlustsvit/säsong 6,3 — kassa -38593,-439252
  seed=30056: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 66.5,43.5,4.0 — max förlustsvit/säsong 4,4,5 — kassa 149995,-166404,-393489
  seed=30057: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 65.0,39.5,1.0 — max förlustsvit/säsong 3,4,5 — kassa 9017,-487601,-993177
  seed=30058: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 52.0,26.5,1.0 — max förlustsvit/säsong 3,4,6 — kassa 74174,-258821,-594701
  seed=30061: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 66.0,3.0 — max förlustsvit/säsong 4,6 — kassa 97665,-244582
  seed=30062: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 28.0,11.5 — max förlustsvit/säsong 4,4 — kassa 15580,-260396
  seed=30065: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 53.5,36.5,10.5 — max förlustsvit/säsong 3,4,7 — kassa 178389,24586,-124210
  seed=30069: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 52.0,35.0,1.0 — max förlustsvit/säsong 3,3,8 — kassa -12361,-357136,-624754
  seed=30071: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 33.0,4.0 — max förlustsvit/säsong 4,4 — kassa 24861,-445695
  seed=30072: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 19.0,0.0 — max förlustsvit/säsong 4,4 — kassa 123552,-155057
  seed=30074: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 20.0,0.5 — max förlustsvit/säsong 4,4 — kassa 27965,-343328
  seed=30075: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 55.5,1.0 — max förlustsvit/säsong 3,5 — kassa 13462,-422902
  seed=30078: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 46.5,0.0 — max förlustsvit/säsong 4,8 — kassa 50250,-461256
  seed=30079: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 51.0,18.0,2.0 — max förlustsvit/säsong 4,7,3 — kassa -32161,-89542,-124338
  seed=30080: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 33.5,17.5,0.0 — max förlustsvit/säsong 5,4,5 — kassa 282615,16078,-77324
  seed=30082: sparkad säsong 1 (boardPatience<=15) — placeringar 9 — patience 9.5 — max förlustsvit/säsong 6 — kassa -163445
  seed=30083: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 36.0,26.0,0.0 — max förlustsvit/säsong 3,3,4 — kassa -172206,-627797,-942744
  seed=30085: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 62.0,22.0,0.0 — max förlustsvit/säsong 3,6,4 — kassa 81080,-248126,-575388
  seed=30086: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 48.5,14.5 — max förlustsvit/säsong 4,6 — kassa 16456,-257268
  seed=30091: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 57.0,35.0,0.0 — max förlustsvit/säsong 4,4,5 — kassa 240990,-22868,-91798
  seed=30096: sparkad säsong 2 (boardPatience<=15) — placeringar 9,9 — patience 21.0,6.0 — max förlustsvit/säsong 6,3 — kassa -12372,-355493
  seed=30097: sparkad säsong 3 (boardPatience<=15) — placeringar 9,9,9 — patience 54.0,29.0,0.0 — max förlustsvit/säsong 4,5,5 — kassa 180263,-158781,-274416

--- club_heros (100 giltiga körningar, 0 kraschade) ---
Sparkad inom 3 säsonger: 100/100 (100.0%)
Avskedsorsak-fördelning: {"boardPatience<=15":100}
Avsked per säsong: {"1":55,"2":36,"3":9}
boardPatience: min=0.0 max=82.5 snitt=15.2 (över alla säsongs-sampel)
Patience-histogram (band om 10): 0-9:95 10-19:7 20-29:15 30-39:11 40-49:12 50-59:8 60-69:4 70-79:1 80-89:1 90-99:0
Klubbkassa: min=-681507 snitt=-101297
  seed=40000: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 29.0,0.0 — max förlustsvit/säsong 4,8 — kassa -94745,-681507
  seed=40001: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 13.0 — max förlustsvit/säsong 7 — kassa -69297
  seed=40002: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 7.0 — max förlustsvit/säsong 8 — kassa 139871
  seed=40003: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 3.0 — max förlustsvit/säsong 7 — kassa -36783
  seed=40004: sparkad säsong 3 (boardPatience<=15) — placeringar 4,4,4 — patience 54.5,26.0,0.0 — max förlustsvit/säsong 4,4,7 — kassa 19055,-403718,-652839
  seed=40005: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 13 — kassa -154580
  seed=40006: sparkad säsong 3 (boardPatience<=15) — placeringar 4,4,4 — patience 54.0,23.0,5.0 — max förlustsvit/säsong 4,5,4 — kassa 75831,-245558,-503502
  seed=40007: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 10 — kassa 69782
  seed=40008: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 6 — kassa -11770
  seed=40009: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 8.0 — max förlustsvit/säsong 7 — kassa 30643
  seed=40010: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 23.0,0.0 — max förlustsvit/säsong 4,4 — kassa -93844,-597816
  seed=40011: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 23.5,6.0 — max förlustsvit/säsong 6,5 — kassa -17700,-399323
  seed=40012: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 21.0,0.0 — max förlustsvit/säsong 7,10 — kassa -111856,-551540
  seed=40013: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 39.5,0.0 — max förlustsvit/säsong 4,5 — kassa 102552,-165247
  seed=40014: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 1.5 — max förlustsvit/säsong 9 — kassa 170704
  seed=40015: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 9 — kassa 53277
  seed=40016: sparkad säsong 3 (boardPatience<=15) — placeringar 4,4,4 — patience 52.0,33.0,0.0 — max förlustsvit/säsong 4,5,8 — kassa 171748,-149610,-553679
  seed=40017: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 14 — kassa -164487
  seed=40018: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 16 — kassa 29015
  seed=40019: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 13 — kassa 15064
  seed=40020: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 1.0 — max förlustsvit/säsong 11 — kassa -99791
  seed=40021: sparkad säsong 3 (boardPatience<=15) — placeringar 4,4,4 — patience 78.5,63.0,3.0 — max förlustsvit/säsong 2,4,14 — kassa 268908,17848,-175390
  seed=40022: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 34.5,11.5 — max förlustsvit/säsong 6,5 — kassa 90410,-47814
  seed=40023: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 9 — kassa -153891
  seed=40024: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 34.0,1.0 — max förlustsvit/säsong 4,9 — kassa 70093,-394942
  seed=40025: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 43.5,1.0 — max förlustsvit/säsong 4,5 — kassa 41512,-291581
  seed=40026: sparkad säsong 3 (boardPatience<=15) — placeringar 4,4,4 — patience 67.0,21.5,0.0 — max förlustsvit/säsong 2,6,13 — kassa 84909,-305991,-530765
  seed=40027: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 45.0,0.0 — max förlustsvit/säsong 4,6 — kassa 138235,-110865
  seed=40028: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 1.0 — max förlustsvit/säsong 8 — kassa -69184
  seed=40029: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 37.5,1.0 — max förlustsvit/säsong 4,10 — kassa 88925,-297849
  seed=40030: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 8.5 — max förlustsvit/säsong 6 — kassa 117427
  seed=40031: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 9 — kassa 46089
  seed=40032: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 11.0 — max förlustsvit/säsong 9 — kassa 71406
  seed=40033: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 1.0 — max förlustsvit/säsong 9 — kassa -18907
  seed=40034: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 5.0 — max förlustsvit/säsong 8 — kassa 9072
  seed=40035: sparkad säsong 3 (boardPatience<=15) — placeringar 4,4,4 — patience 48.0,24.5,0.0 — max förlustsvit/säsong 4,5,6 — kassa 180295,-166545,-541853
  seed=40036: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 1.0 — max förlustsvit/säsong 12 — kassa -41004
  seed=40037: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 30.5,1.0 — max förlustsvit/säsong 4,8 — kassa 90833,-333862
  seed=40038: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 7 — kassa -77331
  seed=40039: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 49.5,0.0 — max förlustsvit/säsong 4,8 — kassa -6548,-426107
  seed=40040: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 48.5,1.0 — max förlustsvit/säsong 4,7 — kassa 152038,-170068
  seed=40041: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 7 — kassa -134911
  seed=40042: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 16.0,0.0 — max förlustsvit/säsong 5,5 — kassa -49308,-541125
  seed=40043: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 51.5,0.0 — max förlustsvit/säsong 5,9 — kassa 160518,-255567
  seed=40044: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 8 — kassa 49218
  seed=40045: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 3.5 — max förlustsvit/säsong 10 — kassa 92399
  seed=40046: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 50.0,0.0 — max förlustsvit/säsong 3,7 — kassa -28822,-559943
  seed=40047: sparkad säsong 3 (boardPatience<=15) — placeringar 4,4,4 — patience 36.0,24.5,0.0 — max förlustsvit/säsong 6,2,9 — kassa 127402,-207102,-585094
  seed=40048: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 7 — kassa -60380
  seed=40049: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 26.0,3.0 — max förlustsvit/säsong 6,9 — kassa 23264,-345100
  seed=40050: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 1.0 — max förlustsvit/säsong 13 — kassa -25377
  seed=40051: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.5 — max förlustsvit/säsong 8 — kassa -41425
  seed=40052: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 53.5,3.5 — max förlustsvit/säsong 3,6 — kassa 139784,-110479
  seed=40053: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 7 — kassa -2608
  seed=40054: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 12 — kassa 18512
  seed=40055: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 62.0,1.0 — max förlustsvit/säsong 3,7 — kassa 193910,-213100
  seed=40056: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 1.0 — max förlustsvit/säsong 10 — kassa 50869
  seed=40057: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 42.5,0.0 — max förlustsvit/säsong 5,9 — kassa -1096,-443022
  seed=40058: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 42.5,0.0 — max förlustsvit/säsong 5,8 — kassa 162294,-119334
  seed=40059: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 11 — kassa 90682
  seed=40060: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 46.0,0.0 — max förlustsvit/säsong 4,14 — kassa 48101,-303866
  seed=40061: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 9 — kassa 59406
  seed=40062: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 28.5,0.0 — max förlustsvit/säsong 5,8 — kassa 61432,-272977
  seed=40063: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 6.0 — max förlustsvit/säsong 9 — kassa -98360
  seed=40064: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 53.5,1.0 — max förlustsvit/säsong 4,7 — kassa 25063,-265621
  seed=40065: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 61.0,3.0 — max förlustsvit/säsong 4,7 — kassa 26146,-404948
  seed=40066: sparkad säsong 3 (boardPatience<=15) — placeringar 4,4,4 — patience 82.5,44.0,0.0 — max förlustsvit/säsong 3,4,10 — kassa 426041,172039,-8012
  seed=40067: sparkad säsong 3 (boardPatience<=15) — placeringar 4,4,4 — patience 34.5,17.5,0.0 — max förlustsvit/säsong 6,2,4 — kassa 110966,-163988,-441345
  seed=40068: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 13 — kassa 42933
  seed=40069: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 55.5,0.0 — max förlustsvit/säsong 3,12 — kassa 73108,-222907
  seed=40070: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 16 — kassa -80152
  seed=40071: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 8.5 — max förlustsvit/säsong 6 — kassa 57804
  seed=40072: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 42.0,0.0 — max förlustsvit/säsong 3,8 — kassa -69703,-538459
  seed=40073: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 8 — kassa -43518
  seed=40074: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 35.0,1.0 — max förlustsvit/säsong 4,9 — kassa 66588,-318184
  seed=40075: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 27.0,1.0 — max förlustsvit/säsong 4,9 — kassa 1743,-380061
  seed=40076: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 1.0 — max förlustsvit/säsong 16 — kassa -102090
  seed=40077: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 11 — kassa 78849
  seed=40078: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 4.0 — max förlustsvit/säsong 6 — kassa 36900
  seed=40079: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 5.5 — max förlustsvit/säsong 5 — kassa 25541
  seed=40080: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 14.0 — max förlustsvit/säsong 7 — kassa -6036
  seed=40081: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 1.0 — max förlustsvit/säsong 7 — kassa 35169
  seed=40082: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 4.0 — max förlustsvit/säsong 7 — kassa -113670
  seed=40083: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 11 — kassa -40493
  seed=40084: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 1.0 — max förlustsvit/säsong 8 — kassa -58694
  seed=40085: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 11 — kassa -32966
  seed=40086: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 3.0 — max förlustsvit/säsong 9 — kassa -57095
  seed=40087: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 3.0 — max förlustsvit/säsong 9 — kassa 142592
  seed=40088: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 40.5,0.0 — max förlustsvit/säsong 3,16 — kassa 99609,-243200
  seed=40089: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 27.5,0.0 — max förlustsvit/säsong 5,5 — kassa 21513,-302499
  seed=40090: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 32.0,1.0 — max förlustsvit/säsong 6,8 — kassa -202,-444679
  seed=40091: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 31.0,0.0 — max förlustsvit/säsong 5,8 — kassa 14606,-292802
  seed=40092: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 24.0,0.0 — max förlustsvit/säsong 8,9 — kassa -88379,-548487
  seed=40093: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 8 — kassa 8649
  seed=40094: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 1.0 — max förlustsvit/säsong 19 — kassa 8711
  seed=40095: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 15.0 — max förlustsvit/säsong 5 — kassa -85027
  seed=40096: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 0.0 — max förlustsvit/säsong 8 — kassa -150638
  seed=40097: sparkad säsong 1 (boardPatience<=15) — placeringar 4 — patience 8.0 — max förlustsvit/säsong 8 — kassa -105701
  seed=40098: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 42.5,0.0 — max förlustsvit/säsong 4,9 — kassa 30236,-346800
  seed=40099: sparkad säsong 2 (boardPatience<=15) — placeringar 4,4 — patience 24.0,0.0 — max förlustsvit/säsong 4,6 — kassa -1499,-451315

=== TOTALT: 157/200 sparkade inom 3 säsonger vid normalt spel ===


[exited with code 0]
