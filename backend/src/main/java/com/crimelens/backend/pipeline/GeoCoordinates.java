package com.crimelens.backend.pipeline;

import java.util.HashMap;
import java.util.Map;

public class GeoCoordinates {
    public static final Map<String, LatLng> STATE_COORDS = new HashMap<>();

    static {
        STATE_COORDS.put("Andhra Pradesh", new LatLng(15.9129, 79.7400));
        STATE_COORDS.put("Arunachal Pradesh", new LatLng(28.2180, 94.7278));
        STATE_COORDS.put("Assam", new LatLng(26.2006, 92.9376));
        STATE_COORDS.put("Bihar", new LatLng(25.0961, 85.3131));
        STATE_COORDS.put("Chhattisgarh", new LatLng(21.2787, 81.8661));
        STATE_COORDS.put("Goa", new LatLng(15.2993, 74.1240));
        STATE_COORDS.put("Gujarat", new LatLng(22.2587, 71.1924));
        STATE_COORDS.put("Haryana", new LatLng(29.0588, 76.0856));
        STATE_COORDS.put("Himachal Pradesh", new LatLng(31.1048, 77.1734));
        STATE_COORDS.put("Jharkhand", new LatLng(23.6102, 85.2799));
        STATE_COORDS.put("Karnataka", new LatLng(15.3173, 75.7139));
        STATE_COORDS.put("Kerala", new LatLng(10.8505, 76.2711));
        STATE_COORDS.put("Madhya Pradesh", new LatLng(22.9734, 78.6569));
        STATE_COORDS.put("Maharashtra", new LatLng(19.7515, 75.7139));
        STATE_COORDS.put("Manipur", new LatLng(24.6637, 93.9063));
        STATE_COORDS.put("Meghalaya", new LatLng(25.4670, 91.3662));
        STATE_COORDS.put("Mizoram", new LatLng(23.1645, 92.9376));
        STATE_COORDS.put("Nagaland", new LatLng(26.1584, 94.5624));
        STATE_COORDS.put("Odisha", new LatLng(20.9517, 85.0985));
        STATE_COORDS.put("Punjab", new LatLng(31.1471, 75.3412));
        STATE_COORDS.put("Rajasthan", new LatLng(27.0238, 74.2179));
        STATE_COORDS.put("Sikkim", new LatLng(27.5330, 88.5122));
        STATE_COORDS.put("Tamil Nadu", new LatLng(11.1271, 78.6569));
        STATE_COORDS.put("Telangana", new LatLng(18.1124, 79.0193));
        STATE_COORDS.put("Tripura", new LatLng(23.9408, 91.9882));
        STATE_COORDS.put("Uttar Pradesh", new LatLng(26.8467, 80.9462));
        STATE_COORDS.put("Uttarakhand", new LatLng(30.0668, 79.0193));
        STATE_COORDS.put("West Bengal", new LatLng(22.9868, 87.8550));
        STATE_COORDS.put("Delhi", new LatLng(28.7041, 77.1025));
        STATE_COORDS.put("Jammu & Kashmir", new LatLng(33.7782, 76.5762));
        STATE_COORDS.put("Ladakh", new LatLng(34.2268, 77.5619));
        STATE_COORDS.put("Chandigarh", new LatLng(30.7333, 76.7794));
        STATE_COORDS.put("Puducherry", new LatLng(11.9416, 79.8083));
        STATE_COORDS.put("Andaman & Nicobar", new LatLng(11.7401, 92.6586));
        STATE_COORDS.put("Lakshadweep", new LatLng(10.5667, 72.6417));
        STATE_COORDS.put("Dadra & Nagar Haveli", new LatLng(20.1809, 73.0169));
        STATE_COORDS.put("Daman & Diu", new LatLng(20.3974, 72.8328));
        STATE_COORDS.put("Pan-India", new LatLng(20.5937, 78.9629));
    }

    public static LatLng forState(String stateName) {
        return STATE_COORDS.getOrDefault(stateName, STATE_COORDS.get("Pan-India"));
    }
}
