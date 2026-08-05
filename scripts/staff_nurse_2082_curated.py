#!/usr/bin/env python3
"""Curated Staff Nurse 2082 Key B bank from PDF review + highlights."""

from __future__ import annotations

import json
from pathlib import Path

# (number, prompt, options[A-D], answer, source)
RAW = [
    (1, "Which type of drugs cause fetal malformation?",
     ["Tocolytic agent", "Teratogenic agent", "Anticoagulant", "Oxytocics"], "B", "highlight"),
    (2, "One middle aged woman having the descent of the cervix and the whole uterus through the introitus is considered as:",
     ["1st degree uterine prolapsed", "2nd degree uterine prolapsed", "3rd degree uterine prolapsed", "4th degree uterine prolapsed"], "D", "highlight"),
    (3, "Separation anxiety starts from:",
     ["Oral stage", "Phallic stage", "Anal stage", "Latent stage"], "A", "highlight"),
    (4, "Common cause of diarrhea in children:",
     ["Giardia", "Adeno virus", "E. coli", "E. Histolytica"], "C", "highlight"),
    (5, "Normal weight of infant at 1 year from birth is:",
     ["Double of birth weight", "Triple of birth weight", "Quadrupled of birth weight", ">10kg"], "B", "highlight"),
    (6, "The relationship that is extremely important in the personality development is:",
     ["The relationship", "Sibling relationship", "Parent child relationship", "Neighborhood relationship"], "C", "highlight"),
    (7, 'A patient states that he hears a voice telling him that he is "Madhav". This misperception is an:',
     ["Delusion", "Hallucination", "Illusion", "False belief"], "B", "highlight"),
    (8, "The term most commonly used for the superego is:",
     ["Conscience", "Ideal self", "Self", "Narcissism"], "A", "ai"),
    (9, "Observe and record enough of the situation to make the behavior or incident meaningful is the principle of:",
     ["Anecdotal report", "Rating scale", "Communication report", "Check list"], "A", "highlight"),
    (10, "Authority is the:",
     ["Expert power", "Coercive power", "Legitimate power", "Political power"], "C", "highlight"),
    (11, "These patients for whom treatment can be delayed for longer hours, need minor care that falls into category:",
     ["Yellow", "Green", "Red", "Black"], "B", "highlight"),
    (12, "If the leader shares decision making power with the group members and explains to the group the reason for personal decision, it is under the:",
     ["Autocratic leadership style", "Laissez faire", "Non leadership style", "Democratic leadership style"], "D", "highlight"),
    (13, '"Job description" is important to provide the employee for clarification of:',
     ["Role, function and responsibility of an individual", "Term of working", "Incentive and facilities", "Rules and working place"], "A", "highlight"),
    (14, "At birth the normal length of baby is about:",
     ["30 cm", "40 cm", "50 cm", "60 cm"], "C", "highlight"),
    (15, "During adolescence, psychological development focuses on:",
     ["Becoming industrious", "Establishing an identity", "Achieving intimacy", "Developing initiative"], "B", "highlight"),
    (16, "When instructing the patient to collect a sputum specimen, the nurse should tell the patient to:",
     ["Collect sputum from evening coughing episode", "Collect sputum from first morning coughing episode", "Collect sputum from any coughing episode", "Keep specimen at room temperature for the duration"], "B", "highlight"),
    (17, "A nursing diagnosis represents the:",
     ["Proposed plan of care", "Client's health problem", "Assessment of client's data", "Actual nursing interventions"], "B", "highlight"),
    (18, "The lowest level of needs in Maslow's hierarchy is:",
     ["Safety and Security need", "Love and belonging", "Physiological", "Self esteem"], "C", "highlight"),
    (19, "Which drug is used for treatment of anemia?",
     ["Tetanus toxoid", "Paracetamol", "Folic acid", "Metronidazole"], "C", "highlight"),
    (20, "Which of the following statement is indicative of typical pain experienced by patient with cholecystitis?",
     ["The pain is usually below sternum", "Eating food makes the pain better", "The pain gets worse after eating fatty food", "The pain is usually related to constipation"], "C", "highlight"),
    (21, "Progressive muscle weakness, leading to ascending paralysis is known as:",
     ["Nephrotic syndrome", "Myasthenia gravis", "Guillain Barre syndrome", "Multiple sclerosis"], "C", "highlight"),
    (22, "Gout is disease of joint, which is caused because of:",
     ["Calcium metabolism disorder", "Purine metabolism disorder", "Phosphate metabolism disorder", "Potassium metabolism disorder"], "B", "highlight"),
    (23, "What do you mean by first aid treatment?",
     ["Immediate care according to situation", "Let the patient sleep", "Nothing to do", "Take temperature"], "A", "highlight"),
    (24, "Oxytocin is produced by:",
     ["Anterior part of pituitary gland", "Posterior part of pituitary gland", "Middle part of pituitary gland", "Adrenal gland"], "B", "highlight"),
    (25, "Fertilization occurs in:",
     ["Vagina", "Uterus", "Ovary", "Fallopian tube"], "D", "highlight"),
    (26, "Covid-19 is declared as pandemic which is caused by:",
     ["Bacteria", "Virus", "Parasites", "Fungus"], "B", "highlight"),
    (27, "One major early problem of a client with a spinal cord injury is:",
     ["Bladder control", "Nutritional intake", "Quadriceps setting", "Use of aids for ambulation"], "A", "highlight"),
    (28, "Most peptic ulcer occurring in the stomach are in the:",
     ["Pyloric portion", "Cardiac portion", "Esophageal junction", "Body of stomach"], "A", "highlight"),
    (29, "The nurse should position a client recovering from general anesthesia in:",
     ["Supine position", "Side lying position", "High fowler's position", "Trendelenburg position"], "B", "highlight"),
    (30, "Collapse of lungs is called:",
     ["Pneumothorax", "Hydrothorax", "Bronchitis", "Atelectasis"], "D", "highlight"),
    (31, "During the blood transfusion, a client develops chills and headache. The nurse's best action is to:",
     ["Notify the physician", "Stop the transfusion immediately", "Slow the transfusion flow to keep vein open", "Administer antipyretic"], "B", "highlight"),
    (32, "A client with osteoporosis is vulnerable to:",
     ["Fatigue fracture", "Pathological fracture", "Compound fracture", "Greenstick fracture"], "B", "ai"),
    (33, "AIDS is caused by:",
     ["Cytomegalo virus", "Varicella-zoster virus", "Human immune deficiency virus", "Acquired immune deficiency syndrome virus"], "C", "highlight"),
    (34, "River outfall is method of:",
     ["Refuse disposal", "Sewage disposal", "Human excreta disposal", "Animal excreta disposal"], "B", "highlight"),
    (35, "Occurrence in the community of a number of cases of disease that is usually large or unexpected is called:",
     ["Endemic", "Epidemic", "Infection", "Pandemic"], "B", "highlight"),
    (36, "Which of the following vaccine is given subcutaneously?",
     ["BCG", "Polio", "Measles", "DPT"], "C", "highlight"),
    (37, "For detection of abnormality, breast examination is performed:",
     ["One week after menstruation", "One week before menstruation", "Immediate after each menstruation", "In any time between two menstruation"], "A", "highlight"),
    (38, "DOTS is related to:",
     ["Cataract", "Pneumonia", "Tuberculosis", "Bronchitis"], "C", "highlight"),
    (39, "Which of the following vitamin prevent neural tube defect in fetus?",
     ["Folic acid", "Vitamin C", "Vitamin D", "Vitamin E"], "A", "highlight"),
    (40, "The main cause of constipation during pregnancy is:",
     ["Decrease physical excretion", "Changes in diet", "Relaxation of the smooth muscle system", "Obstruction to the bowel by presenting part of the fetus"], "C", "highlight"),
    (41, "Gravida refers to:",
     ["A serous pregnancy", "Number of times a female has been pregnant", "Number of live births", "Number of abortions"], "B", "highlight"),
    (42, "Deficiency of Vitamin B12 can cause:",
     ["Iron deficiency anemia", "Aplastic anemia", "Pernicious anemia", "Sickle cell anemia"], "C", "ai"),
    (43, "First fetal movement felt by the mother is known as:",
     ["Lightening", "Ballottement", "Engagement", "Quickening"], "D", "highlight"),
    (44, "A woman experiences passage of stool or flatus through vagina following delivery; what may be the cause?",
     ["Vesico-vaginal fistula", "Vagina urethral fistula", "Recto vaginal fistula", "Vesico urethral fistula"], "C", "highlight"),
    (45, "Gonorrhea is caused by:",
     ["Neisseria gonorrhea", "Treponema pallidum", "Papilloma virus", "Human immune virus"], "A", "highlight"),
    (46, "त्रिभुवन विश्वविद्यालयले कति प्रकारका प्रमुख सेवाहरूको गठन गर्छ?",
     ["२", "३", "४", "५"], "B", "ai"),
    (47, "शिक्षण सेवाको कुन समूहमा कृषि तथा पशु विज्ञान समावेश छ?",
     ["सामान्य समूह", "विज्ञान समूह", "कृषि तथा पशु विज्ञान समूह", "प्राविधिक समूह"], "C", "ai"),
    (48, "प्रशासन समूह कुन सेवामा पर्छ?",
     ["शिक्षण सेवा", "पुस्तकालय सेवा", "प्रशासन सेवा", "प्राविधिक सेवा"], "C", "ai"),
    (49, "त्रिभुवन विश्वविद्यालयका शिक्षक तथा कर्मचारीलाई अनिवार्य अवकाश कहिले दिइन्छ?",
     ["६० वर्ष पुगेपछि", "६२ वर्ष पुगेपछि", "६३ वर्ष पुगेपछि", "६५ वर्ष पुगेपछि"], "D", "ai"),
    (50, "प्रशासक पदमा कार्यरत कर्मचारीलाई अनिवार्य अवकाश कहिले दिइन्छ?",
     ["५ वर्ष सेवा गरेपछि", "६० वर्ष उमेरपछि", "६३ वर्ष उमेरपछि", "१० वर्ष सेवा गरेपछि"], "B", "ai"),
]


def main() -> None:
    out = []
    for num, prompt, opts, ans, src in RAW:
        out.append(
            {
                "id": f"staff-nurse-2082-{num}",
                "paper": "staff-nurse-2082",
                "number": num,
                "prompt": prompt,
                "options": [
                    {"key": k, "text": t}
                    for k, t in zip("ABCD", opts)
                ],
                "answer": ans,
                "answerSource": src,
            }
        )
    path = Path("/tmp/tu-extract/staff-nurse-2082.json")
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(out)} -> {path}")


if __name__ == "__main__":
    main()
