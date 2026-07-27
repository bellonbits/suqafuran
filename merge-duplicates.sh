#!/bin/bash

# Merge all duplicate shops - keep newest, deactivate older

USERS=(455 456 457 458 459 460 461 462 463 464 465 466 467 468 469 470 471 472 473 474 475 476 477 478 481 482 483 484 485 486 487 493)

API_URL="http://165.22.13.173:8011/api/v1"

echo "Merging duplicate shops for ${#USERS[@]} users..."
echo ""

for user_id in "${USERS[@]}"; do
    echo "Merging user $user_id..."
    curl -s -X POST "$API_URL/listings/admin/merge-duplicates?user_id=$user_id" | jq .
    echo ""
done

echo "✅ All duplicates merged!"
