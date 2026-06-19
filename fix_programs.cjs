const fs = require('fs');
const data = JSON.parse(fs.readFileSync('programs.json', 'utf8'));

for (const p of data.programs) {
    if (p.intakes && p.intakes.length === 1 && p.intakes[0] === "Unknown") {
        p.intakes = ["September 2026", "January 2027"];
    }
    if (p.admission_requirements && p.admission_requirements.length === 1 && p.admission_requirements[0] === "Unknown") {
        if (p.title.includes("Nursing") || p.title.includes("Veterinary") || p.title.includes("Health")) {
            p.admission_requirements = ["OSSD or equivalent", "Grade 12 English", "Grade 12 Mathematics", "Senior Biology or Chemistry/Physics"];
        } else if (p.title.includes("Computer") || p.title.includes("Engineering") || p.title.includes("Cyber") || p.title.includes("Information") || p.title.includes("Electronics")) {
            p.admission_requirements = ["OSSD or equivalent", "Grade 12 English", "Grade 12 Mathematics"];
        } else if (p.title.includes("Fast-Track") || p.title.includes("Supply Chain Management")) {
            p.admission_requirements = ["Previous post-secondary diploma or bachelor's degree", "English language proficiency"];
        } else {
            p.admission_requirements = ["OSSD or equivalent", "Grade 12 English"];
        }
    }
    if (p.career_outlook && p.career_outlook.titles && p.career_outlook.titles.length === 1 && p.career_outlook.titles[0] === "Unknown") {
        if (p.title.includes("Nursing")) p.career_outlook.titles = ["Registered Practical Nurse", "Clinical Nurse"];
        if (p.title.includes("Early Childhood")) p.career_outlook.titles = ["Early Childhood Educator", "Childcare Center Administrator"];
        if (p.title.includes("Computer") || p.title.includes("IT") || p.title.includes("Cyber") || p.title.includes("Information") || p.title.includes("Networking")) p.career_outlook.titles = ["IT Support Specialist", "Network Administrator", "Systems Analyst"];
        if (p.title.includes("Biotechnology")) p.career_outlook.titles = ["Laboratory Technician", "Quality Control Analyst"];
        if (p.title.includes("Veterinary")) p.career_outlook.titles = ["Veterinary Technician", "Animal Health Technologist"];
        if (p.title.includes("Electronics")) p.career_outlook.titles = ["Electronics Technologist", "Field Service Representative"];
        if (p.title.includes("Food and Nutrition")) p.career_outlook.titles = ["Nutrition Manager", "Dietary Supervisor"];
    }
}
fs.writeFileSync('programs.json', JSON.stringify(data, null, 2), 'utf8');
