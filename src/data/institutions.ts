export const institutions = [
  "Institut Teknologi Bandung (ITB)",
  "Universitas Indonesia (UI)",
  "Universitas Gadjah Mada (UGM)",
  "Universitas Airlangga (UNAIR)",
  "Universitas Brawijaya (UB)",
  "Universitas Padjadjaran (UNPAD)",
  "Universitas Diponegoro (UNDIP)",
  "Universitas Hasanuddin (UNHAS)",
  "Universitas Sumatera Utara (USU)",
  "Universitas Andalas (UNAND)",
  "Universitas Udayana (UNUD)",
  "Universitas Jember (UNEJ)",
  "Universitas Jenderal Soedirman (UNSOED)",
  "Universitas Lambung Mangkurat (ULM)",
  "Universitas Mulawarman (UNMUL)",
  "Universitas Tanjungpura (UNTAN)",
  "Universitas Halu Oleo (UHO)",
  "Universitas Ahmad Dahlan (UAD)",
  "Universitas Muhammadiyah Yogyakarta (UMY)",
  "Universitas Muhammadiyah Surakarta (UMS)",
  "Universitas Muhammadiyah Malang (UMM)",
  "Universitas Muhammadiyah Prof. Dr. Hamka (UHAMKA)",
  "Universitas Muhammadiyah Purwokerto (UMP)",
  "Universitas Islam Negeri Maulana Malik Ibrahim Malang",
  "Universitas Islam Negeri Syarif Hidayatullah",
  "Universitas Pancasila (UP)",
  "Universitas Surabaya (UBAYA)",
  "Universitas Sanata Dharma (USD)",
  "Universitas Katolik Widya Mandala Surabaya (UKWMS)",
  "Universitas Muslim Indonesia (UMI)",
  "Universitas Islam Indonesia (UII)",
  "Universitas Esa Unggul Jakarta (UEU)",
  "Universitas 17 Agustus 1945 Jakarta (UTA)",
  "Universitas Jenderal Achmad Yani Bandung (UNJANI)",
  "Universitas Bakti Kencana (UBK)",
  "Universitas Bakti Tunas Husada Tasikmalaya (BTH)",
  "Universitas Bali International (UNBI)",
  "Universitas Garut (UNIGA)",
  "Universitas Ma Chung",
  "Universitas Mahasarasvati Denpasar (UNMAS)",
  "Universitas Megarezky (UNIMERZ)",
  "Universitas Setia Budi (USB)",
  "Universitas Sriwijaya (UNSRI)",
  "Universitas Tjut Nyak Dhien (UTND)",
  "Universitas Wahid Hasyim (UNWAHAS)",
  "Universitas Sebelas Maret (UNS)",
  "Universitas Syiah Kuala (USK)",
  "Universitas Riau (UNRI)",
  "Universitas Sam Ratulangi (UNSRAT)",
  "Universitas Islam Bandung (UNISBA)",
  "Universitas Pakuan (UNPAK)",
  "Universitas Mataram (UNRAM)",
  "Universitas Lampung (UNILA)",
  "Universitas Jambi (UNJA)",
  "Universitas Tadulako (UNTAD)",
  "Universitas Negeri Gorontalo (UNG)",
  "Universitas Islam Sultan Agung (UNISSULA)",
  "Universitas Islam Negeri Alauddin Makassar",
  "Institut Teknologi Sumatera (ITERA)",
  "Institut Sains dan Teknologi Nasional (ISTN)",
  "Institut Kesehatan Deli Husada Deli Tua",
  "Institut Kesehatan Medistra Lubuk Pakam",
  "Institut Ilmu Kesehatan Bhakti Wiyata Kediri",
  "Politeknik Kesehatan Kemenkes Jakarta",
  "Politeknik Kesehatan Kemenkes Bandung",
  "Politeknik Kesehatan Kementerian Kesehatan",
  "Sekolah Tinggi Farmasi Indonesia Bandung",
  "Sekolah Tinggi Farmasi Indonesia Perintis Padang",
  "Sekolah Tinggi Ilmu Farmasi",
  "STIFAR Yayasan Pharmasi SMG",
  "STIFAR Riau",
  "STIFAR YPIB Cirebon",
  "STIKES Borneo Lestari",
  "Akademi Farmasi Hang Tuah",
];

// Maps a typed name, a name without its abbreviation, or an abbreviation to the listed
// spelling, so "uns" and "Universitas Sebelas Maret" are stored the same way.
export function resolveInstitution(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  const query = cleaned.toLowerCase();

  for (const institution of institutions) {
    const match = institution.match(/^(.*?)\s*\(([^)]+)\)$/);
    const aliases = match ? [institution, match[1], match[2]] : [institution];

    if (aliases.some((alias) => alias.toLowerCase() === query)) {
      return institution;
    }
  }

  return cleaned;
}

export function isListedInstitution(value: string) {
  return institutions.includes(resolveInstitution(value));
}
