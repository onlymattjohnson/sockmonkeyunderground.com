const REQUIRED_FIELDS = [
    "Monkey Name",
    "First Name",
    "Last Name",
    "Email Address",
    "Address Line 1",
    "City",
    "State",
    "Zip",
    "Country"
];

function redirect(request, status) {
    const url = new URL(request.url);
    url.pathname = "/signup.html";
    url.search = `?status=${status}`;

    return Response.redirect(url.toString(), 303);
}

function trimField(formData, key) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function onRequestPost(context) {
    const { request, env } = context;

    if (!env.AIRTABLE_PAT || !env.AIRTABLE_BASE_ID || !env.AIRTABLE_TABLE_NAME) {
        return redirect(request, "error");
    }

    const formData = await request.formData();

    if (trimField(formData, "consent") !== "yes") {
        return redirect(request, "consent");
    }

    const fields = {};

    for (const key of REQUIRED_FIELDS) {
        const value = trimField(formData, key);
        if (!value) {
            return redirect(request, "invalid");
        }
        fields[key] = value;
    }

    const optionalAddress2 = trimField(formData, "Address Line 2");
    if (optionalAddress2) {
        fields["Address Line 2"] = optionalAddress2;
    }

    const email = fields["Email Address"];
    if (!isValidEmail(email)) {
        return redirect(request, "invalid");
    }

    fields.Source = "SMU Website";

    const endpoint = `https://api.airtable.com/v0/${encodeURIComponent(env.AIRTABLE_BASE_ID)}/${encodeURIComponent(env.AIRTABLE_TABLE_NAME)}`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.AIRTABLE_PAT}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            fields
        })
    });

    if (!response.ok) {
        return redirect(request, "error");
    }

    return redirect(request, "success");
}
