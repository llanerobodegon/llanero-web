"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const BUCKET_NAME = "admin-app";

export const uploadService = {
  async uploadImage(file: File, folder: string): Promise<string> {
    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    // Get public URL
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return data.publicUrl;
  },

  async deleteImage(url: string): Promise<void> {
    // Extract file path from URL
    const urlParts = url.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

    if (error) {
      throw new Error(error.message);
    }
  },

  // Specific helpers for each folder
  async uploadCategoryImage(file: File): Promise<string> {
    return this.uploadImage(file, "categories");
  },

  async uploadSubcategoryImage(file: File): Promise<string> {
    return this.uploadImage(file, "subcategories");
  },

  async uploadWarehouseLogo(file: File): Promise<string> {
    return this.uploadImage(file, "warehouses");
  },

  async uploadProductImage(file: File): Promise<string> {
    return this.uploadImage(file, "products");
  },

  async uploadPaymentProof(file: File): Promise<string> {
    return this.uploadImage(file, "payment-proofs");
  },

  async uploadSliderImage(file: File): Promise<string> {
    return this.uploadImage(file, "sliders");
  },
};
