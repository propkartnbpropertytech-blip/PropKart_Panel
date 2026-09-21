import supabase from "../config/supabase.js";
import { encryptString, encryptJson } from "./encryption.js";

async function run() {
    console.log("Starting encryption migration for all form submissions...");
    const { data: submissions, error } = await supabase
        .from("form_submissions")
        .select("id, registration_code, owner_name, owner_phone, owner_email, address, location_url, direction_url, raw_data");

    if (error) {
        console.error("Failed to query submissions:", error);
        process.exit(1);
    }

    console.log(`Found ${submissions.length} submissions to inspect.`);
    let encryptedCount = 0;

    for (const sub of submissions) {
        const updates = {};
        if (sub.owner_name && !sub.owner_name.startsWith("enc:v1:")) {
            updates.owner_name = encryptString(sub.owner_name);
        }
        if (sub.owner_phone && !sub.owner_phone.startsWith("enc:v1:")) {
            updates.owner_phone = encryptString(sub.owner_phone);
        }
        if (sub.owner_email && !sub.owner_email.startsWith("enc:v1:")) {
            updates.owner_email = encryptString(sub.owner_email);
        }
        if (sub.address && !sub.address.startsWith("enc:v1:")) {
            updates.address = encryptString(sub.address);
        }
        if (sub.location_url && !sub.location_url.startsWith("enc:v1:")) {
            updates.location_url = encryptString(sub.location_url);
        }
        if (sub.direction_url && !sub.direction_url.startsWith("enc:v1:")) {
            updates.direction_url = encryptString(sub.direction_url);
        }
        if (sub.raw_data && sub.raw_data._encrypted !== true) {
            updates.raw_data = encryptJson(sub.raw_data);
        }

        if (Object.keys(updates).length > 0) {
            const { error: updateErr } = await supabase
                .from("form_submissions")
                .update(updates)
                .eq("id", sub.id);

            if (updateErr) {
                console.error(`Error updating submission ${sub.registration_code}:`, updateErr);
            } else {
                encryptedCount++;
                console.log(`Encrypted sensitive fields for: ${sub.registration_code}`);
            }
        }
    }

    console.log(`Encryption migration finished. Encrypted ${encryptedCount} submissions.`);
}

run().catch(console.error);
