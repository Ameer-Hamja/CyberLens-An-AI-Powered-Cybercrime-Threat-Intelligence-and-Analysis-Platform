class GeoExtractor:
    INDIAN_STATES = {
        "Andhra Pradesh": ["andhra pradesh", "vizag", "visakhapatnam", "vijayawada", "ap"],
        "Arunachal Pradesh": ["arunachal pradesh", "itanagar"],
        "Assam": ["assam", "guwahati", "dispur"],
        "Bihar": ["bihar", "patna", "gaya"],
        "Chhattisgarh": ["chhattisgarh", "raipur", "bhilai"],
        "Goa": ["goa", "panaji", "panjim"],
        "Gujarat": ["gujarat", "ahmedabad", "surat", "vadodara", "rajkot", "gj"],
        "Haryana": ["haryana", "gurugram", "gurgaon", "faridabad", "hr"],
        "Himachal Pradesh": ["himachal pradesh", "shimla", "manali"],
        "Jharkhand": ["jharkhand", "ranchi", " jamshedpur"],
        "Karnataka": ["karnataka", "bengaluru", "bangalore", "mysore", "ka"],
        "Kerala": ["kerala", "kochi", "thiruvananthapuram", "kl"],
        "Madhya Pradesh": ["madhya pradesh", "bhopal", "indore", "mp"],
        "Maharashtra": ["maharashtra", "mumbai", "pune", "nagpur", "nashik", "thane", "mh"],
        "Manipur": ["manipur", "imphal"],
        "Meghalaya": ["meghalaya", "shillong"],
        "Mizoram": ["mizoram", "aizawl"],
        "Nagaland": ["nagaland", "kohima", "dimapur"],
        "Odisha": ["odisha", "orissa", "bhubaneswar", "cuttack", "od"],
        "Punjab": ["punjab", "chandigarh", "ludhiana", "amritsar", "pb"],
        "Rajasthan": ["rajasthan", "jaipur", "jodhpur", "udaipur", "rj"],
        "Sikkim": ["sikkim", "gangtok"],
        "Tamil Nadu": ["tamil nadu", "chennai", "coimbatore", "madurai", "tn", "trichy", "salem"],
        "Telangana": ["telangana", "hyderabad", "ts", "tg"],
        "Tripura": ["tripura", "agartala"],
        "Uttar Pradesh": ["uttar pradesh", "lucknow", "kanpur", "varanasi", "agra", "noida", "up"],
        "Uttarakhand": ["uttarakhand", "dehradun", "uk"],
        "West Bengal": ["west bengal", "kolkata", "wb", "calcutta"],
        "Delhi": ["delhi", "new delhi", "ncr", "dwarka", "rohini"],
        "Jammu & Kashmir": ["jammu", "kashmir", "srinagar", "j&k"],
        "Pan-India": ["india", "indian", "nationwide", "all states", "across india"]
    }

    def extract(self, text: str) -> list[str]:
        if not text:
            return ["Pan-India"]
            
        text_lower = text.lower()
        matched_states = set()
        
        for state, keywords in self.INDIAN_STATES.items():
            if state == "Pan-India":
                continue
            for kw in keywords:
                if f"\\b{kw}\\b" in text_lower or f" {kw} " in text_lower or text_lower.startswith(f"{kw} ") or text_lower.endswith(f" {kw}"):
                    matched_states.add(state)
                    break
                elif len(kw) > 3 and kw in text_lower:
                     matched_states.add(state)
                     break

        if not matched_states:
            for kw in self.INDIAN_STATES["Pan-India"]:
                if kw in text_lower:
                    matched_states.add("Pan-India")
                    break
        
        if not matched_states:
            return ["Pan-India"]
            
        return list(matched_states)
