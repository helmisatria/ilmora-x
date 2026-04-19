# IlmoraX Experience Level and Badge - Structured Reference

Source ODS: `docs/IlmoraX - Experience level.ods`

## Extraction Notes

- Structured from `docs/IlmoraX - Experience level.ods`.
- Badge support status is sourced from the `DB_-_Badges` sheet in the ODS workbook.
- Rows marked `supported` are included in proposal scope; rows marked `not_supported` are excluded from proposal scope.
- Badge rows 40, 41, and 42 have missing badge names in the ODS source.
- Institution spelling and codes preserve the source workbook where likely intentional.

## Badge Support Summary

| support_status | count |
| --- | --- |
| supported | 26 |
| not_supported | 21 |
| unknown | 0 |

## Level Progression

| level | grade | experience_required | exp_difference_from_previous_level | total_right_questions_estimate |
| --- | --- | --- | --- | --- |
| 1 | Pharmacy Newbie I | 0 | 0 | 0.0 |
| 2 | Pharmacy Newbie II | 100 | 100 | 25.0 |
| 3 | Pharmacy Novice I | 220 | 120 | 55.0 |
| 4 | Pharmacy Novice II | 360 | 140 | 90.0 |
| 5 | Pharmacy Novice III | 520 | 160 | 130.0 |
| 6 | Pharmacy Trainee I | 700 | 180 | 175.0 |
| 7 | Pharmacy Trainee II | 900 | 200 | 225.0 |
| 8 | Pharmacy Trainee III | 1120 | 220 | 280.0 |
| 9 | Pharmacy Trainee IV | 1360 | 240 | 340.0 |
| 10 | Pharmacy Trainee V | 1620 | 260 | 405.0 |
| 11 | Pharmacy Practitioner I | 1900 | 280 | 475.0 |
| 12 | Pharmacy Practitioner II | 2200 | 300 | 550.0 |
| 13 | Pharmacy Practitioner III | 2520 | 320 | 630.0 |
| 14 | Pharmacy Practitioner IV | 2860 | 340 | 715.0 |
| 15 | Pharmacy Practitioner V | 3220 | 360 | 805.0 |
| 16 | Pharmacy Professional I | 3620 | 400 | 905.0 |
| 17 | Pharmacy Professional II | 4050 | 430 | 1012.5 |
| 18 | Pharmacy Professional III | 4510 | 460 | 1127.5 |
| 19 | Pharmacy Professional IV | 5000 | 490 | 1250.0 |
| 20 | Pharmacy Professional V | 5520 | 520 | 1380.0 |
| 21 | Pharmacy Specialist I | 6070 | 550 | 1517.5 |
| 22 | Pharmacy Specialist II | 6650 | 580 | 1662.5 |
| 23 | Pharmacy Specialist III | 7260 | 610 | 1815.0 |
| 24 | Pharmacy Specialist IV | 7900 | 640 | 1975.0 |
| 25 | Pharmacy Specialist V | 8570 | 670 | 2142.5 |
| 26 | Pharmacy Expert I | 9280 | 710 | 2320.0 |
| 27 | Pharmacy Expert II | 10030 | 750 | 2507.5 |
| 28 | Pharmacy Expert III | 10820 | 790 | 2705.0 |
| 29 | Pharmacy Expert IV | 11650 | 830 | 2912.5 |
| 30 | Pharmacy Expert V | 12520 | 870 | 3130.0 |
| 31 | Pharmacy Consultant I | 13430 | 910 | 3357.5 |
| 32 | Pharmacy Consultant II | 14380 | 950 | 3595.0 |
| 33 | Pharmacy Consultant III | 15380 | 1000 | 3845.0 |
| 34 | Pharmacy Consultant IV | 16430 | 1050 | 4107.5 |
| 35 | Pharmacy Consultant V | 17530 | 1100 | 4382.5 |
| 36 | Pharmacy Master I | 18680 | 1150 | 4670.0 |
| 37 | Pharmacy Master II | 19880 | 1200 | 4970.0 |
| 38 | Pharmacy Master III | 21130 | 1250 | 5282.5 |
| 39 | Pharmacy Master IV | 22430 | 1300 | 5607.5 |
| 40 | Pharmacy Master V | 23780 | 1350 | 5945.0 |
| 41 | Pharmacy Grand-Master I | 25180 | 1400 | 6295.0 |
| 42 | Pharmacy Grand-Master II | 26680 | 1500 | 6670.0 |
| 43 | Pharmacy Grand-Master III | 28280 | 1600 | 7070.0 |
| 44 | Pharmacy Grand-Master IV | 29980 | 1700 | 7495.0 |
| 45 | Pharmacy Grand-Master V | 31780 | 1800 | 7945.0 |
| 46 | Pharmacy Authority I | 33680 | 1900 | 8420.0 |
| 47 | Pharmacy Authority II | 35680 | 2000 | 8920.0 |
| 48 | Pharmacy Authority III | 37780 | 2100 | 9445.0 |
| 49 | Pharmacy Authority IV | 39980 | 2200 | 9995.0 |
| 50 | Pharmacy Legendary | 42280 | 2300 | 10570.0 |

## Badges

| badge_id | no | category | badge_name | task | achievement_bonus_exp | permanent_bonus | support_status | proposal_scope | implementation_rule | dev_note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BADGE-001 | 1 | General | First steps | Complete your first test | 10 |  | supported | in_proposal_scope | Complete first CBT |  |
| BADGE-002 | 2 | Level Badge | Pharmacy Novice Badge | Reach Level 3 | 60 |  | supported | in_proposal_scope | Reach level |  |
| BADGE-003 | 3 | Level Badge | Pharmacy Trainee Badge | Reach Level 6 | 90 |  | supported | in_proposal_scope | Reach level |  |
| BADGE-004 | 4 | Level Badge | Pharmacy Practitioner Badge | Reach Level 11 | 140 | Permanently + 5% exp | supported | in_proposal_scope | Reach level | permanently + exp: only impact future |
| BADGE-005 | 5 | Level Badge | Pharmacy Professional Badge | Reach Level 16 | 200 | Permanently + 10% exp | supported | in_proposal_scope | Reach level | permanently + exp: only impact future |
| BADGE-006 | 6 | Level Badge | Pharmacy Specialist Badge | Reach Level 21 | 275 | Permanently + 15% exp | supported | in_proposal_scope | Reach level | permanently + exp: only impact future |
| BADGE-007 | 7 | Level Badge | Pharmacy Expert Badge | Reach Level 26 |  | Permanently + 20% exp | supported | in_proposal_scope | Reach level | permanently + exp: only impact future |
| BADGE-008 | 8 | Level Badge | Pharmacy Consultant Badge | Reach Level 31 |  | Permanently + 25% exp | supported | in_proposal_scope | Reach level | permanently + exp: only impact future |
| BADGE-009 | 9 | Level Badge | Pharmacy Master Badge | Reach Level 36 |  | Permanently + 30% exp | supported | in_proposal_scope | Reach level | permanently + exp: only impact future |
| BADGE-010 | 10 | Level Badge | Pharmacy Grand-Master Badge | Reach Level 41 |  | Permanently + 35% exp | supported | in_proposal_scope | Reach level | permanently + exp: only impact future |
| BADGE-011 | 11 | Level Badge | Pharmacy Authority Badge | Reach Level 46 |  | Permanently + 40% exp | supported | in_proposal_scope | Reach level | permanently + exp: only impact future |
| BADGE-012 | 12 | Level Badge | Pharmacy Legendary Badge | Reach Level 50 |  |  | supported | in_proposal_scope | Reach level | permanently + exp: only impact future |
| BADGE-013 | 13 | Level Badge | Top 10 | Reach top 10 leaderboard | 200 |  | supported | in_proposal_scope | Weekly leaderboard final rank <= X |  |
| BADGE-014 | 14 | Level Badge | Top 5 | Reach top 5 leaderboard | 500 |  | supported | in_proposal_scope | Weekly leaderboard final rank <= X |  |
| BADGE-015 | 15 | Level Badge | Top 3 | Reach top 3 leaderboard | 750 |  | supported | in_proposal_scope | Weekly leaderboard final rank <= X |  |
| BADGE-016 | 16 | Level Badge | Top 1 | Reach top 1 leaderboard | 1000 |  | supported | in_proposal_scope | Weekly leaderboard final rank <= X |  |
| BADGE-017 | 17 | Streak Badge | 3-Days Streak | Complete CBT every day for 3 days | 300 |  | supported | in_proposal_scope | CBT daily streak >= X |  |
| BADGE-018 | 18 | Streak Badge | 7-Days Streak | Complete CBT every day for 7 days | 700 |  | supported | in_proposal_scope | CBT daily streak >= X |  |
| BADGE-019 | 19 | Streak Badge | 14-Days Streak | Complete CBT every day for 14 days | 1500 |  | supported | in_proposal_scope | CBT daily streak >= X |  |
| BADGE-020 | 20 | Streak Badge | 30-Days Warrior | Complete CBT every day for 30 days | 2000 |  | supported | in_proposal_scope | CBT daily streak >= X |  |
| BADGE-021 | 21 | Streak Badge | Never Skip | No Missed days in a weekly plan | 700 |  | not_supported | out_of_proposal_scope |  | requires a weekly plan feature (creates extra product logic for only this one badge) |
| BADGE-022 | 22 | Streak Badge | Dedicated | Complete 15 CBT | 1000 |  | supported | in_proposal_scope | Completed CBT count >= X |  |
| BADGE-023 | 23 | Streak Badge | Master | Complete 50 CBT | 5000 |  | supported | in_proposal_scope | Completed CBT count >= X |  |
| BADGE-024 | 24 | Streak Badge | Legendary | Complete 100 CBT | 7500 |  | supported | in_proposal_scope | Completed CBT count >= X |  |
| BADGE-025 | 25 | Streak Badge | Speed Runner | Finish CBT under time limit with >80% score | 1000 |  | supported | in_proposal_scope | Speed + score threshold |  |
| BADGE-026 | 26 | Prestige Badge | Fail legend | Reach 5x fail | 1000 |  | supported | in_proposal_scope | Failed CBT count >= X |  |
| BADGE-027 | 27 | Prestige Badge | 100% Club | Reach 100% Score | 5000 |  | supported | in_proposal_scope | Perfect score |  |
| BADGE-028 | 28 | Prestige Badge | Perfect Streak | Achieve > 90% in 5 CBT | 5000 |  | not_supported | out_of_proposal_scope |  |  |
| BADGE-029 | 29 | Prestige Badge | Cumlaude Pharmacist | Maintain 90% average across 10 CBTs | 5000 |  | not_supported | out_of_proposal_scope |  |  |
| BADGE-030 | 30 | Pharmacology Badge | Drug Master | Achieve > 85% Score in Pharmacology Tests | 5000 |  | not_supported | out_of_proposal_scope | Category score threshold |  |
| BADGE-031 | 31 | Pharmacology Badge | Mechanism Master | Achieve > 85% Score in Mechanism of Action Test | 5000 |  | not_supported | out_of_proposal_scope | Category score threshold |  |
| BADGE-032 | 32 | Pharmacology Badge | Clinical Thinker | Achieve > 85% Score in Comprehensive task | 5000 |  | not_supported | out_of_proposal_scope | Category score threshold |  |
| BADGE-033 | 33 | Pharmacology Badge | Oncology Navigator | Achieve > 85% Score in Oncology Tests | 5000 |  | not_supported | out_of_proposal_scope | Category score threshold |  |
| BADGE-034 | 34 | Pharmacology Badge | Vaccinator Specialist | Achieve > 95% Score in Vaccine Test | 2500 |  | not_supported | out_of_proposal_scope | Category score threshold |  |
| BADGE-035 | 35 | Pharmacology Badge | Guideline Guardian | Achieve > 95% Guideline Test | 5000 |  | not_supported | out_of_proposal_scope | Category score threshold |  |
| BADGE-036 | 36 | Pharmacology Badge | Pharmacokinetics Genius | Achieve > 85% in Pharmacokinetics Tests | 5000 |  | not_supported | out_of_proposal_scope | Category score threshold |  |
| BADGE-037 | 37 | Pharmaceutical Badge | Formulatorization | Achieve > 85% in Pharmaceutical Formulation | 5000 |  | not_supported | out_of_proposal_scope | Category score threshold |  |
| BADGE-038 | 38 | Pharmaceutical Badge | GMP Consultant | Achieve > 85% in GMP test | 5000 |  | not_supported | out_of_proposal_scope | Category score threshold |  |
| BADGE-039 | 39 | Pharmaceutical Badge | Human Calculator | Achieve > 85% in Pharmaceutical Calculation | 5000 |  | not_supported | out_of_proposal_scope | Category score threshold |  |
| BADGE-040 | 40 | Pharmaceutical Badge |  |  |  |  | not_supported | out_of_proposal_scope |  |  |
| BADGE-041 | 41 | Pharmaceutical Badge |  |  |  |  | not_supported | out_of_proposal_scope |  |  |
| BADGE-042 | 42 | Pharmacy Badge |  | Achieve > 85% Score in Regulatory Pharmacy Test | 5000 |  | not_supported | out_of_proposal_scope | Category score threshold |  |
| BADGE-043 | 43 | Pharmacy Badge | Ministry of Economy | Achieve > 85% Score in Pharmacoeconomy Test | 5000 |  | not_supported | out_of_proposal_scope | Category score threshold |  |
| BADGE-044 | 44 | Improvement Badge | Rising Star | Improve score by 15% compared to last test | 1000 |  | not_supported | out_of_proposal_scope | Score improved by X% vs previous comparable test |  |
| BADGE-045 | 45 | Improvement Badge | Redemption Arc | Fail a test, then pass it next attempt > 75% | 1000 |  | not_supported | out_of_proposal_scope | Fail then pass next attempt |  |
| BADGE-046 | 46 | Improvement Badge | Memory Builder | Correct Previously wrong question (10 in a row) | 1000 |  | not_supported | out_of_proposal_scope |  |  |
| BADGE-047 | 47 | Improvement Badge | Lightbulb Moment | Improve score in weakest subject to > 70% | 1000 |  | not_supported | out_of_proposal_scope |  |  |

## Achievement Rewards

| reward_id | badge_id | task | achievement_bonus_exp | permanent_bonus | support_status | proposal_scope |
| --- | --- | --- | --- | --- | --- | --- |
| REWARD-001 | BADGE-001 | Complete your first test | 10 |  | supported | in_proposal_scope |
| REWARD-002 | BADGE-002 | Reach Level 3 | 60 |  | supported | in_proposal_scope |
| REWARD-003 | BADGE-003 | Reach Level 6 | 90 |  | supported | in_proposal_scope |
| REWARD-004 | BADGE-004 | Reach Level 11 | 140 | Permanently + 5% exp | supported | in_proposal_scope |
| REWARD-005 | BADGE-005 | Reach Level 16 | 200 | Permanently + 10% exp | supported | in_proposal_scope |
| REWARD-006 | BADGE-006 | Reach Level 21 | 275 | Permanently + 15% exp | supported | in_proposal_scope |
| REWARD-007 | BADGE-007 | Reach Level 26 |  | Permanently + 20% exp | supported | in_proposal_scope |
| REWARD-008 | BADGE-008 | Reach Level 31 |  | Permanently + 25% exp | supported | in_proposal_scope |
| REWARD-009 | BADGE-009 | Reach Level 36 |  | Permanently + 30% exp | supported | in_proposal_scope |
| REWARD-010 | BADGE-010 | Reach Level 41 |  | Permanently + 35% exp | supported | in_proposal_scope |
| REWARD-011 | BADGE-011 | Reach Level 46 |  | Permanently + 40% exp | supported | in_proposal_scope |
| REWARD-012 | BADGE-012 | Reach Level 50 |  |  | supported | in_proposal_scope |
| REWARD-013 | BADGE-013 | Reach top 10 leaderboard | 200 |  | supported | in_proposal_scope |
| REWARD-014 | BADGE-014 | Reach top 5 leaderboard | 500 |  | supported | in_proposal_scope |
| REWARD-015 | BADGE-015 | Reach top 3 leaderboard | 750 |  | supported | in_proposal_scope |
| REWARD-016 | BADGE-016 | Reach top 1 leaderboard | 1000 |  | supported | in_proposal_scope |
| REWARD-017 | BADGE-017 | Complete CBT every day for 3 days | 300 |  | supported | in_proposal_scope |
| REWARD-018 | BADGE-018 | Complete CBT every day for 7 days | 700 |  | supported | in_proposal_scope |
| REWARD-019 | BADGE-019 | Complete CBT every day for 14 days | 1500 |  | supported | in_proposal_scope |
| REWARD-020 | BADGE-020 | Complete CBT every day for 30 days | 2000 |  | supported | in_proposal_scope |
| REWARD-021 | BADGE-021 | No Missed days in a weekly plan | 700 |  | not_supported | out_of_proposal_scope |
| REWARD-022 | BADGE-022 | Complete 15 CBT | 1000 |  | supported | in_proposal_scope |
| REWARD-023 | BADGE-023 | Complete 50 CBT | 5000 |  | supported | in_proposal_scope |
| REWARD-024 | BADGE-024 | Complete 100 CBT | 7500 |  | supported | in_proposal_scope |
| REWARD-025 | BADGE-025 | Finish CBT under time limit with >80% score | 1000 |  | supported | in_proposal_scope |
| REWARD-026 | BADGE-026 | Reach 5x fail | 1000 |  | supported | in_proposal_scope |
| REWARD-027 | BADGE-027 | Reach 100% Score | 5000 |  | supported | in_proposal_scope |
| REWARD-028 | BADGE-028 | Achieve > 90% in 5 CBT | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-029 | BADGE-029 | Maintain 90% average across 10 CBTs | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-030 | BADGE-030 | Achieve > 85% Score in Pharmacology Tests | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-031 | BADGE-031 | Achieve > 85% Score in Mechanism of Action Test | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-032 | BADGE-032 | Achieve > 85% Score in Comprehensive task | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-033 | BADGE-033 | Achieve > 85% Score in Oncology Tests | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-034 | BADGE-034 | Achieve > 95% Score in Vaccine Test | 2500 |  | not_supported | out_of_proposal_scope |
| REWARD-035 | BADGE-035 | Achieve > 95% Guideline Test | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-036 | BADGE-036 | Achieve > 85% in Pharmacokinetics Tests | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-037 | BADGE-037 | Achieve > 85% in Pharmaceutical Formulation | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-038 | BADGE-038 | Achieve > 85% in GMP test | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-039 | BADGE-039 | Achieve > 85% in Pharmaceutical Calculation | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-042 | BADGE-042 | Achieve > 85% Score in Regulatory Pharmacy Test | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-043 | BADGE-043 | Achieve > 85% Score in Pharmacoeconomy Test | 5000 |  | not_supported | out_of_proposal_scope |
| REWARD-044 | BADGE-044 | Improve score by 15% compared to last test | 1000 |  | not_supported | out_of_proposal_scope |
| REWARD-045 | BADGE-045 | Fail a test, then pass it next attempt > 75% | 1000 |  | not_supported | out_of_proposal_scope |
| REWARD-046 | BADGE-046 | Correct Previously wrong question (10 in a row) | 1000 |  | not_supported | out_of_proposal_scope |
| REWARD-047 | BADGE-047 | Improve score in weakest subject to > 70% | 1000 |  | not_supported | out_of_proposal_scope |

## Institution Codes

| category | institution_name | code |
| --- | --- | --- |
| Universitas | Universitas 17 Agustus 1945 Jakarta (UTA) | UTA |
| Universitas | Universitas Ahmad Dahlan (UAD) | UAD |
| Universitas | Universitas Airlangga (UNAIR) | UNAIR |
| Universitas | Universitas Andalas | UNAND |
| Universitas | Universitas Bakti Kencana (UBK) | UBK |
| Universitas | Universitas Brawijaya (UB) | UB |
| Universitas | Universitas Gadjah Mada (UGM) | UGM |
| Universitas | Universitas Garut (UNIGA) | UNIGA |
| Universitas | Universitas Halu Oleo (UHO) | UHO |
| Universitas | Universitas Hasanuddin (UNHAS) | UNHAS |
| Universitas | Universitas Indonesia (UI) | UI |
| Universitas | Universitas Islam Negeri Maulana Malik Ibrahim Malang | UINMLG |
| Universitas | Universitas Islam Negeri Syarif Hidayatullah | UINJKT |
| Universitas | Universitas Jember (UNEJ) | UNEJ |
| Universitas | Universitas Jenderal Achmad Yani Bandung (UNJANI) | UNJADI |
| Universitas | Universitas Jenderal Soedirman (UNSOED) | UNSOED |
| Universitas | Universitas Katolik Widya Mandala Surabaya (UKWMS) | UKWMS |
| Universitas | Universitas Lambung Mangkurat (ULM) | ULM |
| Universitas | Universitas Ma Chung | MACHUNG |
| Universitas | Universitas Megarezky (UNIMERZ) | UNIMERZ |
| Universitas | Universitas Muhammadiyah Malang (UMM) | UMM |
| Universitas | Universitas Muhammadiyah Prof. Dr. Hamka (UHAMKA) | UHAMKA |
| Universitas | Universitas Muhammadiyah Purwokerto (UMP) | UMP |
| Universitas | Universitas Muhammadiyah Surakarta (UMS) | UMS |
| Universitas | Universitas Muhammadiyah Yogyakarta (UMY) | UMY |
| Universitas | Universitas Mulawarman (UNMUL) | UNMUL |
| Universitas | Universitas Muslim Indonesia (UMI) | UMI |
| Universitas | Universitas Padjajaran (UNPAD) | UNPAD |
| Universitas | Universitas Pancasila (UP) | UP |
| Universitas | Universitas Sanata Dharma (USD) | USD |
| Universitas | Universitas Setia Budi (USB) | USB |
| Universitas | Universitas Sumatera Utara (USU) | USU |
| Universitas | Universitas Surabaya (UBAYA) | UBAYA |
| Universitas | Universitas Tanjungpura (UNTAN) | UNTAN |
| Universitas | Universitas Tjut Nyak Dhien (UTND) | UTND |
| Universitas | Universitas Udayana (UNUD) | UNUD |
| Universitas | Universitas Wahid Hasyim (UNWAHAS) | UNWAHAS |
| Universitas | Universitas Mahasarasvati Denpasar (UNMAS) | UNMAS |
| Universitas | Universitas Bali International (UNBI) | UNBI |
| Universitas | Universitas Bakti Tunas Husada Tasikmalaya (BTH) | BTH |
| Sekolah Tinggi | STIFAR Yayasan Pharmasi SMG | STIFARSMG |
| Sekolah Tinggi | STIFAR Riau | STIFARRIAU |
| Sekolah Tinggi | STIFAR YPIB Cirebon | YPIB |
| Sekolah Tinggi | STIKES Borneo Lestari | BORNEOLESTARI |
| Sekolah Tinggi | Sekolah Tinggi Farmasi Indonesia Perintis Padang | STFIPP |
| Sekolah Tinggi | Sekolah Tinggi Farmasi Indonesia Bandung | STFIBDG |
| Institut | Institut Teknologi Bandung (ITB) | ITB |
| Institut | Institut Sains dan Teknologi Nasional (ISTN) | ISTN |
| Institut | Institut Kesehatan Deli Husada Deli Tua | DELIHUSADA |
| Institut | Institut Kesehatan Medistra Lubuk Pakam | MEDISTRA |
| Institut | Institut Ilmu Kesehatan Bhakti Wiyata Kediri | BHAKTIWIYATA |
| D3/S1 saja | Universitas Dipenogoro | UNDIP |
| D3/S1 saja | Akademi Farmasi Hang Tuah | HANGTUAH |
| D3/S1 saja | Politeknik Kesehatan Kemenkes Jakarta | POLTEKESJKT |
| D3/S1 saja | Politeknik Kesehatan Kemenkes Bandung | POLTEKESBDG |
| D3/S1 saja | Universitas Esa Unggul Jakarta (UEU) | UEU |
