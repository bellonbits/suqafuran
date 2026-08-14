<?php
/**
 * Serves Open Graph / Twitter Card meta tags for a single listing, with the
 * listing's own photo as the preview image, to social-media link-preview
 * crawlers only (WhatsApp, Facebook, Twitter, LinkedIn, etc).
 *
 * Why this exists: the site is a client-rendered SPA -- every route,
 * including /listing/{id}, is served the same static index.html with the
 * same generic site-wide og:image. Crawlers never run the SPA's JS, so
 * there's no way for a specific listing's real photo to reach them without
 * a route rewritten to point here (see .htaccess) before the normal
 * catch-all rule.
 *
 * Real visitors never see this page -- the .htaccess rewrite only sends
 * known crawler user-agents here; everyone else still gets the normal SPA.
 */

$id = isset($_GET['id']) ? preg_replace('/[^0-9]/', '', $_GET['id']) : '';

$siteName = 'Suqafuran';
$fallbackImage = 'https://suqafuran.com/og-image.png';
$canonicalUrl = $id !== '' ? "https://suqafuran.com/listing/{$id}" : 'https://suqafuran.com';

$title = "Suqafuran - Africa's Marketplace";
$description = "Buy and sell locally on Suqafuran -- browse thousands of products from local sellers and shops, or list your own.";
$image = $fallbackImage;

if ($id !== '') {
    $ch = curl_init("https://app.suqafuran.com/api/v1/listings/{$id}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response !== false && $httpCode === 200) {
        $listing = json_decode($response, true);
        if (is_array($listing)) {
            $listingTitle = $listing['title_en'] ?? '';
            if ($listingTitle !== '') {
                $title = $listingTitle . ' | ' . $siteName;
            }

            $price = $listing['price'] ?? null;
            $currency = $listing['currency'] ?? '';
            $listingDescription = $listing['description_en'] ?? '';
            $priceLine = ($price !== null) ? trim("{$currency} " . number_format((float) $price)) : '';
            $description = trim($priceLine . ($priceLine && $listingDescription ? ' -- ' : '') . $listingDescription);
            if ($description === '') {
                $description = "Check out this listing on Suqafuran.";
            }
            // Keep social previews from truncating mid-sentence with an ellipsis.
            if (mb_strlen($description) > 200) {
                $description = mb_substr($description, 0, 197) . '...';
            }

            if (!empty($listing['images'][0])) {
                $image = $listing['images'][0];
            }
        }
    }
}

function og_escape($value) {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title><?= og_escape($title) ?></title>
<meta name="description" content="<?= og_escape($description) ?>" />

<meta property="og:type" content="product" />
<meta property="og:site_name" content="<?= og_escape($siteName) ?>" />
<meta property="og:title" content="<?= og_escape($title) ?>" />
<meta property="og:description" content="<?= og_escape($description) ?>" />
<meta property="og:image" content="<?= og_escape($image) ?>" />
<meta property="og:url" content="<?= og_escape($canonicalUrl) ?>" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="<?= og_escape($title) ?>" />
<meta name="twitter:description" content="<?= og_escape($description) ?>" />
<meta name="twitter:image" content="<?= og_escape($image) ?>" />

<meta http-equiv="refresh" content="0; url=<?= og_escape($canonicalUrl) ?>" />
</head>
<body>
<p><a href="<?= og_escape($canonicalUrl) ?>">View this listing on Suqafuran</a></p>
</body>
</html>
