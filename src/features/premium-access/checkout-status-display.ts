export function getCheckoutStatusDisplayState(
  status: string,
  providerStatus: string | null = null,
) {
  if (status === "paid") {
    return {
      title: "Pembayaran berhasil",
      description: "Akses sudah aktif. Kamu bisa kembali ke Dashboard dan mulai belajar.",
      accent: "#16a34a",
      icon: "success" as const,
    };
  }

  if (status === "expired") {
    return {
      title: "Pembayaran kedaluwarsa",
      description: "Waktu pembayaran sudah habis. Buat Checkout baru untuk melanjutkan.",
      accent: "#f59e0b",
      icon: "warning" as const,
    };
  }

  if (status === "review_required") {
    return {
      title: "Pembayaran sedang diperiksa",
      description: "Pembayaran diterima, tetapi datanya perlu diverifikasi Admin sebelum akses dibuka.",
      accent: "#f97316",
      icon: "warning" as const,
    };
  }

  if (status === "cancelled" && isFailedProviderStatus(providerStatus)) {
    return {
      title: "Pembayaran gagal",
      description: "Pembayaran tidak berhasil diproses. Silakan buat Checkout baru atau pilih metode pembayaran lain.",
      accent: "#ef4444",
      icon: "error" as const,
    };
  }

  if (status === "cancelled") {
    return {
      title: "Pembayaran dibatalkan",
      description: "Pembayaran ini sudah dibatalkan. Buat Checkout baru untuk mencoba lagi.",
      accent: "#ef4444",
      icon: "error" as const,
    };
  }

  return {
    title: "Menunggu konfirmasi",
    description: "Kami sedang mengecek status pembayaran dari Midtrans. Halaman ini akan memperbarui otomatis.",
    accent: "#205072",
    icon: "pending" as const,
  };
}

function isFailedProviderStatus(providerStatus: string | null) {
  if (!providerStatus) return false;

  return ["deny", "failed", "failure"].includes(providerStatus.toLowerCase());
}
