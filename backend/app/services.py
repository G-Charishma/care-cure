from .models import Medicine

# Comprehensive Catalog of 55+ Verified OTC Medicines & Healthcare Supplies
MOCK_MEDICINES = [
    # ==========================================
    # 1. Pain, Fever & Inflammation
    # ==========================================
    Medicine(
        id=1,
        name="ParaCure Extra 500mg",
        description="Fast-acting Paracetamol for fever reduction, headaches, body ache, and mild arthritis relief.",
        price=5.99,
        category="Pain & Fever",
        dosage_form="Tablets (20 pcs)",
        rating=4.9,
        reviews_count=482,
        badge="Best Seller",
        in_stock=True,
        dosage_guidance="1-2 tablets every 4-6 hours with water. Max 8 per day."
    ),
    Medicine(
        id=2,
        name="IbuAct Fast Relief 400mg",
        description="Targeted anti-inflammatory NSAID for acute headache, toothache, muscle aches, and menstrual cramps.",
        price=7.49,
        category="Pain & Fever",
        dosage_form="Softgels (16 pcs)",
        rating=4.8,
        reviews_count=320,
        badge="Top Rated",
        in_stock=True,
        dosage_guidance="1 capsule with meals or milk every 6 hours."
    ),
    Medicine(
        id=3,
        name="AspiPlus Cardio Protect 75mg",
        description="Low-dose enteric-coated aspirin for cardiovascular wellness and mild pain relief.",
        price=6.25,
        category="Pain & Fever",
        dosage_form="Enteric Tablets (30 pcs)",
        rating=4.7,
        reviews_count=190,
        badge="Doctor Recommended",
        in_stock=True,
        dosage_guidance="Take 1 tablet daily with a full glass of water."
    ),
    Medicine(
        id=4,
        name="MigraStop Quick Action",
        description="Specialized blend of paracetamol, caffeine, and ibuprofen for severe migraine & tension headaches.",
        price=9.80,
        category="Pain & Fever",
        dosage_form="Caplets (12 pcs)",
        rating=4.9,
        reviews_count=215,
        badge="Fast Acting",
        in_stock=True,
        dosage_guidance="2 caplets at onset of migraine symptoms."
    ),
    Medicine(
        id=5,
        name="NaproRelief 220mg Extended",
        description="Long-acting Naproxen Sodium providing up to 12 hours of uninterrupted joint, back, and muscular pain relief.",
        price=10.50,
        category="Pain & Fever",
        dosage_form="Tablets (24 pcs)",
        rating=4.8,
        reviews_count=175,
        badge="12-Hour Relief",
        in_stock=True,
        dosage_guidance="1 tablet every 8 to 12 hours with a full glass of water."
    ),

    # ==========================================
    # 2. Cold, Cough & Allergy
    # ==========================================
    Medicine(
        id=6,
        name="AllergyRelief Cetirizine 10mg",
        description="24-hour non-drowsy relief from allergic rhinitis, watery eyes, sneezing, and hives.",
        price=8.50,
        category="Cold & Allergy",
        dosage_form="Tablets (30 pcs)",
        rating=4.8,
        reviews_count=365,
        badge="Best Seller",
        in_stock=True,
        dosage_guidance="1 tablet once daily in the evening."
    ),
    Medicine(
        id=7,
        name="CoughSyrup Soothe Herbal Formula",
        description="Honey and ivy leaf enriched soothing syrup for chesty cough, throat irritation, and bronchial calm.",
        price=6.75,
        category="Cold & Allergy",
        dosage_form="Syrup (150 ml)",
        rating=4.7,
        reviews_count=410,
        badge="Natural Formula",
        in_stock=True,
        dosage_guidance="10ml three times daily after meals."
    ),
    Medicine(
        id=8,
        name="ClearBreathe Menthol Nasal Spray",
        description="Oxymetazoline nasal decongestant mist providing instant sinus and blocked nose clearance.",
        price=6.50,
        category="Cold & Allergy",
        dosage_form="Nasal Spray (20 ml)",
        rating=4.8,
        reviews_count=290,
        badge="Fast Acting",
        in_stock=True,
        dosage_guidance="1-2 sprays into each nostril every 10-12 hours."
    ),
    Medicine(
        id=9,
        name="ThroatCalm Honey & Lemon Lozenges",
        description="Antibacterial and numbing lozenges for rapid relief from sore throat and hoarseness.",
        price=4.50,
        category="Cold & Allergy",
        dosage_form="Lozenges (24 pcs)",
        rating=4.9,
        reviews_count=520,
        badge="Top Rated",
        in_stock=True,
        dosage_guidance="Dissolve 1 lozenge slowly in the mouth every 2-3 hours."
    ),
    Medicine(
        id=10,
        name="SinusRelief Night Caplets",
        description="Multi-symptom nighttime cold & sinus formula for restful sleep without congestion or runny nose.",
        price=8.90,
        category="Cold & Allergy",
        dosage_form="Caplets (16 pcs)",
        rating=4.6,
        reviews_count=180,
        badge=None,
        in_stock=True,
        dosage_guidance="2 caplets at bedtime with water."
    ),
    Medicine(
        id=11,
        name="FexoShield 180mg Non-Drowsy",
        description="High-strength Fexofenadine antihistamine for severe seasonal hay fever and chronic urticaria.",
        price=13.50,
        category="Cold & Allergy",
        dosage_form="Tablets (20 pcs)",
        rating=4.9,
        reviews_count=310,
        badge="Non-Drowsy",
        in_stock=True,
        dosage_guidance="1 tablet daily with water before meals."
    ),
    Medicine(
        id=12,
        name="MucusClear Guaifenesin 600mg",
        description="Extended-release expectorant to thin and loosen mucus, relieving chest congestion and cough discomfort.",
        price=11.20,
        category="Cold & Allergy",
        dosage_form="Bi-layer Tablets (14 pcs)",
        rating=4.7,
        reviews_count=195,
        badge=None,
        in_stock=True,
        dosage_guidance="1 tablet every 12 hours with plenty of fluids."
    ),

    # ==========================================
    # 3. Digestion & Stomach Care
    # ==========================================
    Medicine(
        id=13,
        name="DigestEase Antacid Liquid Gel",
        description="Triple-action fast relief from acid reflux, heartburn, sour stomach, and indigestion.",
        price=7.25,
        category="Digestion & Stomach",
        dosage_form="Suspension (200 ml)",
        rating=4.8,
        reviews_count=340,
        badge="Best Seller",
        in_stock=True,
        dosage_guidance="10-20ml taken between meals and at bedtime."
    ),
    Medicine(
        id=14,
        name="OmepraGuard 20mg",
        description="Proton pump inhibitor (PPI) for 24-hour persistent heartburn prevention and stomach acid control.",
        price=11.50,
        category="Digestion & Stomach",
        dosage_form="Delayed Release Capsules (14 pcs)",
        rating=4.9,
        reviews_count=275,
        badge="Doctor Recommended",
        in_stock=True,
        dosage_guidance="Take 1 capsule in the morning before breakfast."
    ),
    Medicine(
        id=15,
        name="ProbioHealth 50 Billion CFU",
        description="Multi-strain daily probiotic with prebiotics for gut microbiome balance, digestion, and immunity.",
        price=19.99,
        category="Digestion & Stomach",
        dosage_form="Veggie Capsules (30 pcs)",
        rating=4.9,
        reviews_count=410,
        badge="Top Rated",
        in_stock=True,
        dosage_guidance="1 capsule daily with morning water or juice."
    ),
    Medicine(
        id=16,
        name="HydraBoost Electrolyte Sachet Pack",
        description="WHO-formula oral rehydration salts with zinc to rapidly replenish electrolytes during dehydration.",
        price=4.20,
        category="Digestion & Stomach",
        dosage_form="Powder Sachets (10 pcs)",
        rating=4.9,
        reviews_count=610,
        badge="Essential Care",
        in_stock=True,
        dosage_guidance="Mix 1 sachet in 200ml clean drinking water."
    ),
    Medicine(
        id=17,
        name="GasRelief Simethicone 125mg",
        description="Extra strength gas & bloating relief chewables for rapid pressure breakdown.",
        price=5.80,
        category="Digestion & Stomach",
        dosage_form="Chewable Tablets (30 pcs)",
        rating=4.7,
        reviews_count=230,
        badge=None,
        in_stock=True,
        dosage_guidance="Chew 1-2 tablets thoroughly after meals."
    ),
    Medicine(
        id=18,
        name="LoperStop Anti-Diarrheal 2mg",
        description="Fast symptom control for acute diarrhea, traveler's diarrhea, and cramping stomach upsets.",
        price=6.90,
        category="Digestion & Stomach",
        dosage_form="Caplets (12 pcs)",
        rating=4.8,
        reviews_count=260,
        badge="Fast Acting",
        in_stock=True,
        dosage_guidance="2 caplets after first loose stool, then 1 after each subsequent loose stool."
    ),
    Medicine(
        id=19,
        name="LaxaPure Gentle Senna + Docusate",
        description="Dual-action overnight relief for occasional constipation and uncomfortable bowel stiffness.",
        price=8.40,
        category="Digestion & Stomach",
        dosage_form="Tablets (30 pcs)",
        rating=4.6,
        reviews_count=180,
        badge=None,
        in_stock=True,
        dosage_guidance="Take 1-2 tablets with a glass of water before bedtime."
    ),

    # ==========================================
    # 4. Skin & Dermatology
    # ==========================================
    Medicine(
        id=20,
        name="DermaCream Plus Hydrocortisone 1%",
        description="Max-strength anti-itch topical cream for eczema, dermatitis, insect bites, and allergic skin flares.",
        price=12.00,
        category="Skin & Dermatology",
        dosage_form="Topical Cream (30g)",
        rating=4.8,
        reviews_count=380,
        badge="Doctor Recommended",
        in_stock=True,
        dosage_guidance="Apply thinly to affected area 2 to 3 times daily."
    ),
    Medicine(
        id=21,
        name="FungiClear Clotrimazole 1%",
        description="Broad-spectrum antifungal cream for ringworm, athlete's foot, jock itch, and fungal rashes.",
        price=8.95,
        category="Skin & Dermatology",
        dosage_form="Topical Cream (20g)",
        rating=4.8,
        reviews_count=295,
        badge="Top Rated",
        in_stock=True,
        dosage_guidance="Apply twice daily for 2 to 4 weeks consistently."
    ),
    Medicine(
        id=22,
        name="Calamine Soothing Lotion",
        description="Gentle cooling calamine with zinc oxide for sunburns, chickenpox rash, poison ivy, and hives.",
        price=6.50,
        category="Skin & Dermatology",
        dosage_form="Lotion (100 ml)",
        rating=4.7,
        reviews_count=340,
        badge="Gentle Care",
        in_stock=True,
        dosage_guidance="Shake well. Apply using cotton pad to affected skin."
    ),
    Medicine(
        id=23,
        name="AcneShield Benzoyl Peroxide 5%",
        description="Dermatologist tested targeted gel to clear acne breakouts, unclog pores, and prevent blackheads.",
        price=13.20,
        category="Skin & Dermatology",
        dosage_form="Gel Tube (30g)",
        rating=4.6,
        reviews_count=210,
        badge=None,
        in_stock=True,
        dosage_guidance="Apply small dab to clean acne-prone areas once daily."
    ),
    Medicine(
        id=24,
        name="AloePure 99% Organic Soothing Gel",
        description="Pure cold-pressed aloe vera gel enriched with Vitamin E for skin redness, post-sun cooling, and minor burns.",
        price=9.50,
        category="Skin & Dermatology",
        dosage_form="Gel Jar (250 ml)",
        rating=4.9,
        reviews_count=430,
        badge="Natural Formula",
        in_stock=True,
        dosage_guidance="Smooth liberally over face and body as needed."
    ),
    Medicine(
        id=25,
        name="PsoriaCalm Coal Tar Healing Shampoo",
        description="Therapeutic formulation targeting scalp psoriasis, seborrheic dermatitis, flaking, and severe dandruff.",
        price=14.80,
        category="Skin & Dermatology",
        dosage_form="Medicated Shampoo (200 ml)",
        rating=4.7,
        reviews_count=190,
        badge="Clinical Grade",
        in_stock=True,
        dosage_guidance="Massage into wet scalp, leave for 3-5 minutes, then rinse thoroughly twice weekly."
    ),

    # ==========================================
    # 5. Vitamins & Supplements
    # ==========================================
    Medicine(
        id=26,
        name="VitaGlow C 1000mg + Zinc",
        description="High-potency effervescent Vitamin C with zinc and bioflavonoids for optimal immune defense.",
        price=15.99,
        category="Vitamins & Supplements",
        dosage_form="Effervescent Tablets (20 pcs)",
        rating=4.9,
        reviews_count=520,
        badge="Best Seller",
        in_stock=True,
        dosage_guidance="Dissolve 1 tablet in 150ml water daily after breakfast."
    ),
    Medicine(
        id=27,
        name="D3 SunBoost 60,000 IU",
        description="High-dose cholecalciferol Vitamin D3 for bone strength, muscle vitality, and calcium absorption.",
        price=14.50,
        category="Vitamins & Supplements",
        dosage_form="Softgels (8 pcs)",
        rating=4.9,
        reviews_count=430,
        badge="Doctor Recommended",
        in_stock=True,
        dosage_guidance="Take 1 softgel weekly with a meal containing healthy fats."
    ),
    Medicine(
        id=28,
        name="Omega-3 Ultra Pure Fish Oil 1200mg",
        description="Molecularly distilled fish oil rich in EPA and DHA for heart health, joint flexibility, and brain clarity.",
        price=18.50,
        category="Vitamins & Supplements",
        dosage_form="Softgel Capsules (60 pcs)",
        rating=4.8,
        reviews_count=390,
        badge="Top Rated",
        in_stock=True,
        dosage_guidance="Take 1-2 softgels daily with meals."
    ),
    Medicine(
        id=29,
        name="DailyMulti Gold with Minerals",
        description="Complete 24-in-1 multivitamin formula with Iron, B-Complex, Magnesium, and Antioxidants.",
        price=16.75,
        category="Vitamins & Supplements",
        dosage_form="Tablets (60 pcs)",
        rating=4.8,
        reviews_count=310,
        badge="Daily Essential",
        in_stock=True,
        dosage_guidance="1 tablet daily with food."
    ),
    Medicine(
        id=30,
        name="IronVital + Folic Acid 100mg",
        description="Gentle on the stomach chelated iron supplement for fatigue, energy, and healthy red blood cells.",
        price=11.20,
        category="Vitamins & Supplements",
        dosage_form="Tablets (30 pcs)",
        rating=4.7,
        reviews_count=185,
        badge=None,
        in_stock=True,
        dosage_guidance="1 tablet daily on an empty stomach or with fruit juice."
    ),
    Medicine(
        id=31,
        name="B-Complex Active Methylated",
        description="High-potency B-vitamins (B12, B6, Folate) for cellular energy metabolism, nerve repair, and stress defense.",
        price=13.90,
        category="Vitamins & Supplements",
        dosage_form="Capsules (60 pcs)",
        rating=4.8,
        reviews_count=245,
        badge="Energy Boost",
        in_stock=True,
        dosage_guidance="1 capsule each morning with water."
    ),
    Medicine(
        id=32,
        name="Calcium Citrate + K2 & Zinc",
        description="Advanced bone mineral matrix with high-bioavailability Calcium Citrate and Vitamin K2-MK7.",
        price=17.40,
        category="Vitamins & Supplements",
        dosage_form="Tablets (60 pcs)",
        rating=4.8,
        reviews_count=220,
        badge="Bone Health",
        in_stock=True,
        dosage_guidance="Take 2 tablets daily with lunch or dinner."
    ),

    # ==========================================
    # 6. First Aid & Antiseptics
    # ==========================================
    Medicine(
        id=33,
        name="PoviHeal 10% Antiseptic Solution",
        description="Gold standard Povidone-Iodine germicidal solution for cuts, scrapes, burns, and minor wound disinfection.",
        price=5.50,
        category="First Aid",
        dosage_form="Solution (100 ml)",
        rating=4.9,
        reviews_count=480,
        badge="Hospital Grade",
        in_stock=True,
        dosage_guidance="Clean wound and apply directly with sterile gauze."
    ),
    Medicine(
        id=34,
        name="BurnCool Silver Sulfadiazine Cream",
        description="Immediate soothing antimicrobial burn cream for minor burns, scalds, and sunburn blisters.",
        price=8.20,
        category="First Aid",
        dosage_form="Cream (30g)",
        rating=4.8,
        reviews_count=230,
        badge="Fast Acting",
        in_stock=True,
        dosage_guidance="Apply 2-4mm thick layer onto cleaned burn area."
    ),
    Medicine(
        id=35,
        name="CarePlast Waterproof Bandage Kit",
        description="Assorted 50-pack breathable, sterile waterproof adhesive bandages for daily protection.",
        price=4.99,
        category="First Aid",
        dosage_form="Bandage Box (50 pcs)",
        rating=4.8,
        reviews_count=370,
        badge="Best Seller",
        in_stock=True,
        dosage_guidance="Apply to dry, cleaned wound. Change daily."
    ),
    Medicine(
        id=36,
        name="NeoSporin Plus Pain Relief Ointment",
        description="Triple antibiotic first aid ointment with pramoxine for 24-hour infection defense and pain calm.",
        price=9.40,
        category="First Aid",
        dosage_form="Ointment (28g)",
        rating=4.9,
        reviews_count=395,
        badge="Top Rated",
        in_stock=True,
        dosage_guidance="Apply small amount 1 to 3 times daily."
    ),
    Medicine(
        id=37,
        name="Digital Rapid Thermometer 10s",
        description="Clinically calibrated digital body thermometer with waterproof tip, fever alert beep, and memory recall.",
        price=8.99,
        category="First Aid",
        dosage_form="Device (1 pc)",
        rating=4.9,
        reviews_count=540,
        badge="Essential Device",
        in_stock=True,
        dosage_guidance="Place orally, underarm, or rectally until beep sounds (approx 10s)."
    ),
    Medicine(
        id=38,
        name="Elastic Support Crepe Bandage 10cm",
        description="High-elasticity breathable cotton compression wrap for sprains, muscle strains, and joint swelling.",
        price=3.99,
        category="First Aid",
        dosage_form="Bandage Roll (10cm x 4m)",
        rating=4.7,
        reviews_count=290,
        badge=None,
        in_stock=True,
        dosage_guidance="Wrap firmly around injured joint without restricting circulation."
    ),

    # ==========================================
    # 7. Eye, Ear & Oral Care
    # ==========================================
    Medicine(
        id=39,
        name="OptiTears Lubricant Eye Drops",
        description="Preservative-free artificial tears for dry, strained, and computer-screen fatigued eyes.",
        price=9.75,
        category="Eye & Ear Care",
        dosage_form="Sterile Drops (15 ml)",
        rating=4.8,
        reviews_count=320,
        badge="Doctor Recommended",
        in_stock=True,
        dosage_guidance="Instill 1-2 drops in affected eye(s) as needed."
    ),
    Medicine(
        id=40,
        name="AllerDrop Antihistamine Eye Solution",
        description="Ketotifen fumarate eye drops for rapid itch relief from pollen, dust, and pet dander.",
        price=11.20,
        category="Eye & Ear Care",
        dosage_form="Eye Drops (5 ml)",
        rating=4.7,
        reviews_count=190,
        badge="Fast Acting",
        in_stock=True,
        dosage_guidance="1 drop in each eye twice daily (every 8-12 hours)."
    ),
    Medicine(
        id=41,
        name="EarWax Clear Wax Removal Drops",
        description="Gentle carbamide peroxide foaming drops for safe, painless earwax dissolving and ear hygiene.",
        price=8.50,
        category="Eye & Ear Care",
        dosage_form="Ear Drops with Bulb (15 ml)",
        rating=4.6,
        reviews_count=215,
        badge=None,
        in_stock=True,
        dosage_guidance="Tilt head and place 5-10 drops into ear; leave for several minutes."
    ),
    Medicine(
        id=42,
        name="OraHeal Fast Ulcer Relief Gel",
        description="Anesthetic choline salicylate and lidocaine gel providing instant numbness and healing for mouth ulcers.",
        price=5.80,
        category="Eye & Ear Care",
        dosage_form="Oral Gel (10g)",
        rating=4.9,
        reviews_count=410,
        badge="Fast Acting",
        in_stock=True,
        dosage_guidance="Apply small dab directly to ulcer with clean fingertip every 3-4 hours."
    ),
    Medicine(
        id=43,
        name="Dentocare Clove Oil Drops",
        description="Concentrated pure therapeutic clove oil for instant temporary relief from acute toothache and gum pain.",
        price=4.90,
        category="Eye & Ear Care",
        dosage_form="Liquid (10 ml)",
        rating=4.8,
        reviews_count=280,
        badge="Natural Formula",
        in_stock=True,
        dosage_guidance="Dip cotton tip in 1-2 drops and gently press against the aching tooth."
    ),

    # ==========================================
    # 8. Joint & Muscle Relief
    # ==========================================
    Medicine(
        id=44,
        name="FlexiJoint Glucosamine & Chondroitin",
        description="Triple-strength joint cartilage nutrition with MSM for knee flexibility, stiffness, and joint mobility.",
        price=18.00,
        category="Joint & Muscle Relief",
        dosage_form="Tablets (60 pcs)",
        rating=4.8,
        reviews_count=350,
        badge="Top Rated",
        in_stock=True,
        dosage_guidance="Take 2 tablets daily with a meal."
    ),
    Medicine(
        id=45,
        name="VoltaRelief Diclofenac Pain Gel 1%",
        description="Clinically proven penetrating non-greasy pain relief gel for arthritis, back pain, and sprains.",
        price=11.80,
        category="Joint & Muscle Relief",
        dosage_form="Gel (50g)",
        rating=4.9,
        reviews_count=460,
        badge="Best Seller",
        in_stock=True,
        dosage_guidance="Gently massage 2-4g onto painful joint/muscle 3 to 4 times daily."
    ),
    Medicine(
        id=46,
        name="DeepHeat Herbal Pain Patch",
        description="Long-lasting 8-hour continuous therapeutic warm herbal patches for backache and shoulder stiffness.",
        price=7.50,
        category="Joint & Muscle Relief",
        dosage_form="Patches (5 pcs)",
        rating=4.7,
        reviews_count=240,
        badge="Fast Acting",
        in_stock=True,
        dosage_guidance="Peel protective backing and apply directly to painful area."
    ),
    Medicine(
        id=47,
        name="Magnesium Muscle Relax Gel",
        description="Transdermal magnesium chloride gel with arnica for sports recovery, muscle tightness, and leg cramps.",
        price=13.50,
        category="Joint & Muscle Relief",
        dosage_form="Gel (120 ml)",
        rating=4.7,
        reviews_count=180,
        badge=None,
        in_stock=True,
        dosage_guidance="Rub thoroughly into tired muscles post-workout or before bed."
    ),

    # ==========================================
    # 9. Sleep, Stress & Wellness
    # ==========================================
    Medicine(
        id=48,
        name="SleepWell Melatonin 5mg + Chamomile",
        description="Non-habit forming natural sleep regulator with botanical chamomile & L-Theanine for sound sleep.",
        price=9.50,
        category="Sleep & Wellness",
        dosage_form="Gummies (60 pcs)",
        rating=4.8,
        reviews_count=490,
        badge="Best Seller",
        in_stock=True,
        dosage_guidance="Chew 1-2 gummies 30 minutes before bedtime."
    ),
    Medicine(
        id=49,
        name="AshwaCalm Organic KSM-66 600mg",
        description="Standardized root extract Ashwagandha to lower cortisol, manage daily stress, and promote mental calm.",
        price=16.50,
        category="Sleep & Wellness",
        dosage_form="Veggie Capsules (60 pcs)",
        rating=4.9,
        reviews_count=380,
        badge="Organic Certified",
        in_stock=True,
        dosage_guidance="1 capsule twice daily with warm milk or water."
    ),
    Medicine(
        id=50,
        name="Magnesium Glycinate Muscle Relax 400mg",
        description="High-absorption gentle magnesium to relieve nocturnal leg cramps, relax muscles, and support calm nerves.",
        price=14.90,
        category="Sleep & Wellness",
        dosage_form="Capsules (90 pcs)",
        rating=4.8,
        reviews_count=310,
        badge="Doctor Recommended",
        in_stock=True,
        dosage_guidance="Take 2 capsules with dinner or 1 hour before sleep."
    ),
    Medicine(
        id=51,
        name="Brahmi Mind Clarity 500mg",
        description="Ayurvedic Bacopa Monnieri herbal extract for cognitive focus, memory recall, and mental calmness.",
        price=12.50,
        category="Sleep & Wellness",
        dosage_form="Veggie Capsules (60 pcs)",
        rating=4.7,
        reviews_count=210,
        badge=None,
        in_stock=True,
        dosage_guidance="1 capsule daily after a meal."
    ),

    # ==========================================
    # 10. Women & Family Care
    # ==========================================
    Medicine(
        id=52,
        name="FemiRelief Period Cramp Support",
        description="Specialized antispasmodic botanical blend with ginger and magnesium for menstrual cramps and bloating.",
        price=10.80,
        category="Women & Family",
        dosage_form="Capsules (30 pcs)",
        rating=4.9,
        reviews_count=340,
        badge="Top Rated",
        in_stock=True,
        dosage_guidance="1-2 capsules with warm water during menstrual discomfort."
    ),
    Medicine(
        id=53,
        name="CranGuard D-Mannose + Cranberry 500mg",
        description="Clinical strength urinary tract wellness supplement preventing bacteria adhesion and discomfort.",
        price=15.20,
        category="Women & Family",
        dosage_form="Veggie Capsules (60 pcs)",
        rating=4.8,
        reviews_count=290,
        badge="Doctor Recommended",
        in_stock=True,
        dosage_guidance="2 capsules daily with a full glass of water."
    ),
    Medicine(
        id=54,
        name="BabyCalm Colic & Teething Drops",
        description="Gentle herbal fennel & dill water drops for infant colic, gas discomfort, hiccups, and teething tears.",
        price=7.90,
        category="Women & Family",
        dosage_form="Oral Liquid with Dropper (50 ml)",
        rating=4.9,
        reviews_count=420,
        badge="Gentle Care",
        in_stock=True,
        dosage_guidance="Use dropper to place 0.5ml - 1ml slowly into baby's cheek."
    ),
    Medicine(
        id=55,
        name="DermaBaby Zinc Oxide Diaper Balm",
        description="Hypoallergenic 40% zinc oxide barrier cream to prevent and soothe delicate diaper rash overnight.",
        price=8.75,
        category="Women & Family",
        dosage_form="Cream Tube (100g)",
        rating=4.9,
        reviews_count=360,
        badge="Best Seller",
        in_stock=True,
        dosage_guidance="Apply liberally with each diaper change, especially at bedtime."
    ),

    # ==========================================
    # 11. Diabetes & Cardio Care
    # ==========================================
    Medicine(
        id=56,
        name="GlucoCheck Blood Glucose Test Strips",
        description="No-coding auto-calibration glucose test strips providing accurate blood sugar results in 5 seconds.",
        price=22.50,
        category="Diabetes & Heart",
        dosage_form="Test Strips Box (50 pcs)",
        rating=4.9,
        reviews_count=580,
        badge="Hospital Grade",
        in_stock=True,
        dosage_guidance="Insert strip into glucometer; apply 0.5µl capillary blood sample."
    ),
    Medicine(
        id=57,
        name="CoQ10 200mg Ubiquinone Heart Support",
        description="High-absorption cellular antioxidant for cardiovascular vigor, blood vessel elasticity, and statin users.",
        price=24.90,
        category="Diabetes & Heart",
        dosage_form="Softgels (60 pcs)",
        rating=4.8,
        reviews_count=270,
        badge="Doctor Recommended",
        in_stock=True,
        dosage_guidance="Take 1 softgel daily with a meal containing fats."
    ),
    Medicine(
        id=58,
        name="GarlicPure Aged Cardio Extract 1000mg",
        description="Odorless aged garlic extract supporting healthy cholesterol levels and optimal blood pressure circulation.",
        price=13.80,
        category="Diabetes & Heart",
        dosage_form="Tablets (90 pcs)",
        rating=4.7,
        reviews_count=210,
        badge=None,
        in_stock=True,
        dosage_guidance="Take 1 tablet twice daily with water."
    ),
]

def get_all_medicines():
    return MOCK_MEDICINES

def recommend_medicines_for_symptoms(symptoms: str):
    symptoms_lower = symptoms.lower()
    if "fever" in symptoms_lower or "headache" in symptoms_lower or "body ache" in symptoms_lower:
        return "Mild Fever / Tension Headache", [MOCK_MEDICINES[0], MOCK_MEDICINES[1], MOCK_MEDICINES[15]]
    elif "cough" in symptoms_lower or "throat" in symptoms_lower or "cold" in symptoms_lower:
        return "Upper Respiratory Infection / Cough", [MOCK_MEDICINES[6], MOCK_MEDICINES[8], MOCK_MEDICINES[7], MOCK_MEDICINES[11]]
    elif "allergy" in symptoms_lower or "sneeze" in symptoms_lower or "itch" in symptoms_lower or "rash" in symptoms_lower:
        return "Allergic Reaction / Rhinitis", [MOCK_MEDICINES[5], MOCK_MEDICINES[10], MOCK_MEDICINES[19], MOCK_MEDICINES[21]]
    elif "stomach" in symptoms_lower or "acidity" in symptoms_lower or "heartburn" in symptoms_lower or "gas" in symptoms_lower:
        return "Gastric Acidity / Indigestion", [MOCK_MEDICINES[12], MOCK_MEDICINES[13], MOCK_MEDICINES[14], MOCK_MEDICINES[16]]
    elif "pain" in symptoms_lower or "joint" in symptoms_lower or "back" in symptoms_lower or "muscle" in symptoms_lower:
        return "Musculoskeletal Pain & Strain", [MOCK_MEDICINES[43], MOCK_MEDICINES[44], MOCK_MEDICINES[1], MOCK_MEDICINES[45]]
    elif "sleep" in symptoms_lower or "insomnia" in symptoms_lower or "stress" in symptoms_lower:
        return "Sleep Disturbance / Elevated Stress", [MOCK_MEDICINES[47], MOCK_MEDICINES[48], MOCK_MEDICINES[49]]
    elif "eye" in symptoms_lower or "ear" in symptoms_lower or "tooth" in symptoms_lower or "ulcer" in symptoms_lower:
        return "Eye / Ear / Oral Sensitivity", [MOCK_MEDICINES[38], MOCK_MEDICINES[41], MOCK_MEDICINES[42]]
    else:
        return "General Wellness Consultation", [MOCK_MEDICINES[0], MOCK_MEDICINES[25], MOCK_MEDICINES[28]]

def analyze_skin_allergy_image(filename: str):
    # AI dermatology analysis
    return (
        "Contact Dermatitis & Mild Urticaria",
        "AllergyRelief Cetirizine 10mg / Soothing Syrup 10ml",
        [MOCK_MEDICINES[5], MOCK_MEDICINES[19], MOCK_MEDICINES[21], MOCK_MEDICINES[32]]
    )
