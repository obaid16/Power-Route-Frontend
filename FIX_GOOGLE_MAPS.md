# 🗺️ Fix Google Maps Not Showing

## ❌ The Error
```
Google Maps Platform rejected your request. This API is not activated on your API project.
```

## 🎯 Root Cause
The Google Maps API key exists but the required APIs are not enabled in Google Cloud Console.

---

## ✅ Solution 1: Enable Google Maps APIs (Recommended)

### Step 1: Go to Google Cloud Console
Open: https://console.cloud.google.com/

### Step 2: Select Your Project
- Click on the project dropdown at the top
- Select the project associated with your API key: `AIzaSyBd2IVDRSRgpfKhfaHpuC5s4h63WE1lgvE`

### Step 3: Enable Required APIs
Go to: https://console.cloud.google.com/apis/library

Enable these APIs:
1. **Maps JavaScript API** ✅
   - https://console.cloud.google.com/apis/library/maps-backend.googleapis.com

2. **Maps SDK for Android** ✅ (if using Android)
   - https://console.cloud.google.com/apis/library/maps-android-backend.googleapis.com

3. **Maps SDK for iOS** ✅ (if using iOS)
   - https://console.cloud.google.com/apis/library/maps-ios-backend.googleapis.com

4. **Directions API** ✅ (for route polylines)
   - https://console.cloud.google.com/apis/library/directions-backend.googleapis.com

5. **Places API** ✅ (optional, for place search)
   - https://console.cloud.google.com/apis/library/places-backend.googleapis.com

### Step 4: Verify API Key Restrictions
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Under "API restrictions":
   - Select "Restrict key"
   - Check all the APIs you enabled above
4. Under "Application restrictions":
   - For development: Select "None"
   - For production: Set appropriate restrictions
5. Click "Save"

### Step 5: Wait and Test
- Wait 1-2 minutes for changes to propagate
- Restart your app
- Map should now load

---

## ✅ Solution 2: Create New API Key (If Above Doesn't Work)

### Step 1: Create New Project
1. Go to: https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name: "VoltPath" or any name
4. Click "Create"

### Step 2: Enable APIs
1. Go to: https://console.cloud.google.com/apis/library
2. Enable all the APIs listed in Solution 1

### Step 3: Create API Key
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the new API key
4. Click "Restrict Key"
5. Under "API restrictions": Select the APIs you enabled
6. Click "Save"

### Step 4: Update .env File
Replace the old key in `.env`:
```env
EXPO_PUBLIC_GOOGLE_MAPS_KEY=YOUR_NEW_API_KEY_HERE
```

### Step 5: Restart App
```bash
npx expo start --clear
```

---

## ✅ Solution 3: Use OpenStreetMap (Free Alternative)

If you don't want to deal with Google Maps billing, use OpenStreetMap:

### Step 1: Update LiveMapScreen.jsx
Remove Google Maps provider:

**Find this line:**
```javascript
provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
```

**Change to:**
```javascript
provider={undefined}
```

This will use the default map provider (Apple Maps on iOS, OpenStreetMap on Android/Web).

### Step 2: Remove Google Maps Key Requirement
The app will work without a Google Maps API key.

### Step 3: Restart App
```bash
npx expo start --clear
```

---

## 🔧 Quick Fix (Temporary)

### Option 1: Disable Google Maps Provider
Edit `src/screens/LiveMapScreen.jsx`:

**Line ~130 (find the MapView component):**
```javascript
<MapView
  ref={mapRef}
  style={StyleSheet.absoluteFill}
  initialRegion={initialRegion}
  provider={undefined}  // ← Change this from PROVIDER_GOOGLE to undefined
  showsUserLocation={showsUserLocation}
  ...
```

### Option 2: Use Default Map
Comment out the provider prop entirely:
```javascript
<MapView
  ref={mapRef}
  style={StyleSheet.absoluteFill}
  initialRegion={initialRegion}
  // provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}  // ← Comment this out
  showsUserLocation={showsUserLocation}
  ...
```

---

## 📋 Step-by-Step: Enable APIs (Detailed)

### 1. Open Google Cloud Console
```
https://console.cloud.google.com/
```

### 2. Navigate to APIs & Services
- Click hamburger menu (☰) on top left
- Click "APIs & Services"
- Click "Library"

### 3. Search and Enable Each API
For each API below:
1. Search for the API name
2. Click on it
3. Click "Enable"
4. Wait for it to enable

**APIs to Enable:**
- Maps JavaScript API
- Maps SDK for Android
- Maps SDK for iOS
- Directions API
- Geocoding API (optional)
- Places API (optional)

### 4. Configure API Key
- Go to "Credentials" in left menu
- Click on your API key
- Under "API restrictions":
  - Select "Restrict key"
  - Check all enabled APIs
- Click "Save"

### 5. Billing (Important!)
Google Maps requires billing to be enabled:
1. Go to "Billing" in left menu
2. Link a billing account
3. Don't worry: Google provides $200 free credit per month
4. For development, you likely won't exceed free tier

---

## 🆘 Troubleshooting

### Issue: "API key not valid"
**Solution:**
1. Check if API key is correct in `.env`
2. Verify APIs are enabled
3. Wait 1-2 minutes after enabling APIs
4. Restart app with `npx expo start --clear`

### Issue: "Billing not enabled"
**Solution:**
1. Go to: https://console.cloud.google.com/billing
2. Link a billing account
3. Enable billing for your project
4. Note: $200/month free credit should cover development

### Issue: "Map shows but no routes"
**Solution:**
1. Enable "Directions API"
2. Restart app

### Issue: "Map still not showing"
**Solution:**
Use the temporary fix (disable Google provider):
```javascript
provider={undefined}
```

---

## 💡 Recommended Approach

### For Development (Quick Fix)
Use default map provider (no Google API needed):
```javascript
// In LiveMapScreen.jsx
provider={undefined}
```

### For Production (Best Quality)
1. Enable all Google Maps APIs
2. Set up billing (free tier is generous)
3. Use Google Maps provider for best experience

---

## 🎯 Quick Commands

### After Enabling APIs
```bash
# Clear cache and restart
npx expo start --clear
```

### If Using New API Key
```bash
# 1. Update .env file with new key
# 2. Clear cache and restart
npx expo start --clear
```

---

## 📝 Summary

**Problem:** Google Maps APIs not enabled

**Quick Fix:** Use default map provider (no API key needed)
```javascript
provider={undefined}
```

**Proper Fix:** Enable APIs in Google Cloud Console
1. Go to https://console.cloud.google.com/apis/library
2. Enable Maps JavaScript API
3. Enable Maps SDK for Android/iOS
4. Enable Directions API
5. Wait 1-2 minutes
6. Restart app

**Alternative:** Use OpenStreetMap (free, no API key needed)

---

## ✅ Next Steps

Choose one:

1. **Quick Fix (5 seconds):**
   - Edit LiveMapScreen.jsx
   - Change `provider={PROVIDER_GOOGLE}` to `provider={undefined}`
   - Restart app

2. **Proper Fix (5 minutes):**
   - Enable APIs in Google Cloud Console
   - Wait 1-2 minutes
   - Restart app

3. **New API Key (10 minutes):**
   - Create new project
   - Enable APIs
   - Create new API key
   - Update .env
   - Restart app

---

## 🎉 After Fixing

Map should load and show:
- ✅ User location
- ✅ Charging stations
- ✅ Route polylines
- ✅ Navigation controls

The map will be fully functional! 🗺️
