#!/usr/bin/env python3
import os, json, requests, sys
from datetime import datetime

# Read credentials
def read_env(key):
    val = os.environ.get(key)
    if val:
        return val

    paths = [
        "c:/Users/rober/Cloude CODE/.env",
        "../../../.env",
        "../../.env",
        "../.env",
        ".env"
    ]

    for path in paths:
        try:
            with open(path) as f:
                for line in f:
                    if line.startswith(key + "="):
                        return line.split("=", 1)[1].strip()
        except:
            pass
    return None

token = read_env("META_ACCESS_TOKEN")
# Use Bodega Dos Hemisferios account
account_id = "act_2836455319797730"

if not token or not account_id:
    print("❌ Error: META_ACCESS_TOKEN o AD_ACCOUNT_ID no configurados")
    sys.exit(1)

print(f"✅ Token found (last 4 chars: ...{token[-4:]})")
print(f"✅ Account ID: {account_id}")
print()

# Fetch all campaigns
print("📋 Fetching campaigns...")
campaigns_resp = requests.get(
    f"https://graph.facebook.com/v21.0/{account_id}/campaigns",
    params={
        "access_token": token,
        "fields": "id,name,status,objective,daily_budget,lifetime_budget",
        "limit": 100
    }
).json()

if "error" in campaigns_resp:
    print(f"❌ Error: {campaigns_resp['error']}")
    sys.exit(1)

campaigns = campaigns_resp.get("data", [])
print(f"✅ Found {len(campaigns)} campaigns")
print()

# Fetch insights for each campaign for August 2026-08-01 to today
fields = [
    "campaign_name", "campaign_id", "spend", "impressions", "reach",
    "clicks", "ctr", "cpc", "frequency", "cpm",
    "actions", "action_values", "cost_per_action_type",
    "quality_ranking", "engagement_rate_ranking"
]

agosto_data = {
    "period": "2026-08-01 a 2026-08-04",
    "timestamp": datetime.now().isoformat(),
    "campaigns": []
}

for i, camp in enumerate(campaigns, 1):
    camp_id = camp["id"]
    camp_name = camp["name"]
    print(f"[{i}/{len(campaigns)}] {camp_name}...", end=" ", flush=True)

    insights_resp = requests.get(
        f"https://graph.facebook.com/v21.0/{camp_id}/insights",
        params={
            "access_token": token,
            "fields": ",".join(fields),
            "time_range": json.dumps({"since": "2026-08-01", "until": "2026-08-04"}),
            "level": "campaign"
        }
    ).json()

    if "error" in insights_resp:
        print(f"⚠️ {insights_resp['error']['message']}")
        continue

    insights = insights_resp.get("data", [])
    if insights:
        data_point = insights[0]
        data_point["campaign"] = camp
        agosto_data["campaigns"].append(data_point)
        print(f"✅ ${data_point.get('spend', '0')}")
    else:
        print("(no data)")

# Save to file
output_file = "agosto_insights.json"
with open(output_file, "w") as f:
    json.dump(agosto_data, f, indent=2)

print()
print(f"✅ Saved to {output_file}")
print(f"Total campaigns with data: {len(agosto_data['campaigns'])}")

# Print summary
total_spend = sum(float(c.get("spend", 0)) for c in agosto_data["campaigns"])
total_impressions = sum(int(c.get("impressions", 0)) for c in agosto_data["campaigns"])
print(f"💰 Total spend: ${total_spend:.2f}")
print(f"📊 Total impressions: {total_impressions:,}")
