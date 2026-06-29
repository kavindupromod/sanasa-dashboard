const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { fmAbayaToUnicode } = require('sinhala-unicode-coverter');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Enable CORS for all requests to support file:// origin fallback
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Global state variables
let prevData = [];
let currData = [];
let prevFileName = 'pastdue_2026-05-06.xls';
let currFileName = 'pastdue_2026-06-11.xls';

// Seed default rules
let rules = [
    {
        loanType: 'Isuru Loan (ඉසුරු ණය)',
        field: 'installments',
        operator: '>',
        value: 3
    }
];

// Helper to normalize loan types
function normalizeLoanType(type) {
    if (!type) return 'Other Loan (වෙනත් ණය)';
    const t = String(type).trim();
    
    // Legacy Sinhalese character mappings to canonical UI strings
    if (t === 'biq$Kh' || t === 'biqre Kh') return 'Isuru Loan (ඉසුරු ණය)';
    if (t === 'CI$Kh' || t === 'CIKsl Kh') return 'Chikitsa Loan (චිකිත්සා ණය)';
    if (t === 'ffo$jHd$Kh' || t === 'ffoksl jHdmdr Kh') return 'Daily Business Loan (දෛනික ව්‍යාපාර ණය)';
    if (t === 'i;s$Kh' || t === 'i;s Kh') return 'Weekly Loan (සති ණය)';
    if (t === 'idud$Kh' || t === 'idudkH Kh') return 'Samanya Loan (සාමාන්‍ය ණය)';
    if (t === 'ikS$Kh' || t === 'ikSmdrCIl Kh') return 'Saneeparakshaka Loan (සනීපාරක්ෂක ණය)';
    if (t === 'ksjd$Kh' || t === 'ksjdi Kh') return 'Housing Loan (නිවාස ණය)';
    if (t === 'lDIs$Kh' || t === 'lDIs Kh') return 'Agricultural Loan (කෘෂි ණය)';
    if (t === 'ld$i$i$Kh' || t === 'ldrl iNd iyk Kh') return 'Karaka Sabha Sahana Loan (කාරක සභා සහන ණය)';
    if (t === 'l$i$Kh' || t === 'lkavdhï i;s Kh') return 'Group Weekly Loan (කණ්ඩායම් සති ණය)';
    if (t === 'm%$Kh' || t === 'm%j¾Ok Kh') return 'Development Loan (ප්‍රවර්ධන ණය)';
    if (t === 'Nd$Kh' || t === 'NdKav Kh') return 'Goods Loan (භාණ්ඩ ණය)';
    if (t === 'Wm$Kh' || t === 'Wmydr Kh') return 'Upahara Loan (උපහාර ණය)';
    if (t === 'wdmÞ Kh') return 'Disaster Relief Loan (ආපදා ණය)';
    return t;
}

// Clean and format translated Unicode Sinhala names
function cleanUnicodeName(rawName) {
    if (!rawName) return '';
    let name = fmAbayaToUnicode(rawName);
    
    // Fix common visual ligatures used in FM fonts for 'ඥ' (Gnya) using exact Unicode escape sequences
    name = name.replace(/\u0DD9\u0D9A\u0DCA\u200D\u0DAF\u0DCF\u0DCA/g, '\u0DA5\u0DDD'); // fCoda -> ඥෝ
    name = name.replace(/\u0D9A\u0DCA\u200D\u0DAF\u0DCF/g, '\u0DA5\u0DCF');             // Cod -> ඥා
    name = name.replace(/\u0D9A\u0DCA\u200D\u0DAF/g, '\u0DA5');                         // Co -> ඥ
    
    // Fix standard initials spelling errors (e.g. 'ඩි' -> 'ඩී' for D.)
    name = name.replace(/ඩබි\./g, 'ඩබ්.');
    name = name.replace(/ඩි\./g, 'ඩී.');
    
    return name.trim();
}

// Function to automatically locate the best worksheet containing the main data
function parseExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    let bestSheetName = '';
    let bestSheetData = [];
    let bestSheetHeaders = [];
    let highestScore = -1;
    let headerIndex = -1;

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (rawData.length === 0) return;

        // Scan first 15 rows to find headers and score the sheet
        let sheetHeaderIdx = -1;
        let score = 0;
        let foundHeaders = [];

        for (let i = 0; i < Math.min(rawData.length, 15); i++) {
            const row = rawData[i];
            if (!row) continue;
            
            // Check for key columns in legacy Sinhala characters
            const hasMemberId = row.includes("id' wxlh") || row.includes("idudcsl wxlh");
            const hasName = row.includes(".Kqfokqlre") || row.includes("ku");
            const hasZone = row.includes("n, m%foaYh") || row.includes("n, m%foaY");
            const hasLoanType = row.includes("Kh jra.h");
            const hasBalance = row.includes("fYAIh");

            let rowScore = 0;
            if (hasMemberId) rowScore += 10;
            if (hasName) rowScore += 10;
            if (hasZone) rowScore += 20; // High weight for zone segregation
            if (hasLoanType) rowScore += 20; // High weight for loan type
            if (hasBalance) rowScore += 10;

            if (rowScore > score) {
                score = rowScore;
                sheetHeaderIdx = i;
                foundHeaders = row.map(h => String(h).trim());
            }
        }

        if (score > highestScore && sheetHeaderIdx !== -1) {
            highestScore = score;
            bestSheetName = sheetName;
            bestSheetData = rawData;
            bestSheetHeaders = foundHeaders;
            headerIndex = sheetHeaderIdx;
        }
    });

    if (highestScore <= 0) {
        throw new Error(`Could not find a valid data worksheet with headers in ${path.basename(filePath)}`);
    }

    console.log(`Parsed ${path.basename(filePath)} | Sheet selected: "${bestSheetName}" (Score: ${highestScore.toFixed(2)})`);

    // Convert raw rows to structured objects
    const records = [];
    for (let i = headerIndex + 1; i < bestSheetData.length; i++) {
        const row = bestSheetData[i];
        if (!row || row.length === 0) continue;

        const rec = {};
        bestSheetHeaders.forEach((h, idx) => {
            rec[h] = row[idx];
        });

        // Normalize data fields
        const memberId = rec["id' wxlh"] || rec["idudcsl wxlh"];
        const loanId = rec["K' wxlh"] || rec["Loan ID"];
        const name = rec[".Kqfokqlre"] || rec["ku"] || rec["Customer Name"];
        const zone = rec["n, m%foaYh"] !== undefined ? rec["n, m%foaYh"] : rec["n, m%foaY"];
        const loanType = rec["Kh jra.h"] || rec["Loan Type"];
        const balance = rec["fYAIh"] !== undefined ? rec["fYAIh"] : rec["Balance"];
        const loanAmount = rec["Kh uqo,"] !== undefined ? rec["Kh uqo,"] : rec["Loan Amount"];
        const installments = rec["jdrsl .Kk"] !== undefined ? rec["jdrsl .Kk"] : 0;

        if (memberId !== undefined && memberId !== null && String(memberId).trim() !== "") {
            records.push({
                memberId: String(memberId).trim(),
                loanId: loanId ? String(loanId).trim() : '',
                name: name ? cleanUnicodeName(name) : 'Unknown Member',
                zone: (zone !== undefined && zone !== null && !isNaN(Number(zone))) ? Number(zone) : 0,
                loanType: normalizeLoanType(loanType),
                balance: (balance !== undefined && !isNaN(Number(balance))) ? Number(balance) : 0,
                loanAmount: (loanAmount !== undefined && !isNaN(Number(loanAmount))) ? Number(loanAmount) : 0,
                installments: (installments !== undefined && !isNaN(Number(installments))) ? Number(installments) : 0,
                raw: rec
            });
        }
    }

    return records;
}

// Function to compute deltas between previous and current datasets
function analyzeLedgerDeltas(prevList, currList) {
    const prevMapById = new Map(); // key: memberId_loanId
    const prevMapByType = new Map(); // key: memberId_loanType -> array of records

    prevList.forEach(r => {
        const idKey = `${r.memberId}_${r.loanId}`;
        prevMapById.set(idKey, r);

        const typeKey = `${r.memberId}_${r.loanType}`;
        if (!prevMapByType.has(typeKey)) prevMapByType.set(typeKey, []);
        prevMapByType.get(typeKey).push(r);
    });

    const matchedPrevKeys = new Set();
    const changes = [];

    // Analyze current list against previous
    currList.forEach(curr => {
        let prev = null;
        let matchMethod = '';

        // 1. Try matching by exact Member ID + Loan ID
        const idKey = `${curr.memberId}_${curr.loanId}`;
        if (prevMapById.has(idKey)) {
            prev = prevMapById.get(idKey);
            matchMethod = 'exact_loan_id';
            matchedPrevKeys.add(idKey);
        } else {
            // 2. Fall back to Member ID + Loan Type if unique
            const typeKey = `${curr.memberId}_${curr.loanType}`;
            const potentialMatches = prevMapByType.get(typeKey) || [];
            // Only match if there is a single unmatched loan of this type for the member
            const unmatched = potentialMatches.filter(p => !matchedPrevKeys.has(`${p.memberId}_${p.loanId}`));
            if (unmatched.length === 1) {
                prev = unmatched[0];
                matchMethod = 'fallback_loan_type';
                matchedPrevKeys.add(`${prev.memberId}_${prev.loanId}`);
            }
        }

        if (!prev) {
            // New Past Due Member
            changes.push({
                type: 'NEW_PAST_DUE',
                memberId: curr.memberId,
                loanId: curr.loanId,
                name: curr.name,
                loanType: curr.loanType,
                zone: curr.zone,
                prevBalance: 0,
                currBalance: curr.balance,
                balanceChange: curr.balance,
                prevInstallments: 0,
                currInstallments: curr.installments
            });
        } else {
            // Found in both: check balance trajectory
            const diff = curr.balance - prev.balance;
            if (diff > 0) {
                changes.push({
                    type: 'AMOUNT_INCREASED',
                    memberId: curr.memberId,
                    loanId: curr.loanId,
                    name: curr.name,
                    loanType: curr.loanType,
                    zone: curr.zone,
                    prevBalance: prev.balance,
                    currBalance: curr.balance,
                    balanceChange: diff,
                    prevInstallments: prev.installments,
                    currInstallments: curr.installments
                });
            } else if (diff < 0) {
                changes.push({
                    type: 'AMOUNT_DECREASED',
                    memberId: curr.memberId,
                    loanId: curr.loanId,
                    name: curr.name,
                    loanType: curr.loanType,
                    zone: curr.zone,
                    prevBalance: prev.balance,
                    currBalance: curr.balance,
                    balanceChange: diff,
                    prevInstallments: prev.installments,
                    currInstallments: curr.installments
                });
            } else {
                changes.push({
                    type: 'NO_CHANGE',
                    memberId: curr.memberId,
                    loanId: curr.loanId,
                    name: curr.name,
                    loanType: curr.loanType,
                    zone: curr.zone,
                    prevBalance: prev.balance,
                    currBalance: curr.balance,
                    balanceChange: 0,
                    prevInstallments: prev.installments,
                    currInstallments: curr.installments
                });
            }
        }
    });

    // Check for Cleared Accounts (present in prev list but not matched/present in curr)
    prevList.forEach(prev => {
        const idKey = `${prev.memberId}_${prev.loanId}`;
        if (!matchedPrevKeys.has(idKey)) {
            changes.push({
                type: 'CLEARED',
                memberId: prev.memberId,
                loanId: prev.loanId,
                name: prev.name,
                loanType: prev.loanType,
                zone: prev.zone,
                prevBalance: prev.balance,
                currBalance: 0,
                balanceChange: -prev.balance,
                prevInstallments: prev.installments,
                currInstallments: 0
            });
        }
    });

    return changes;
}

// Function to evaluate rules for a record
function evaluateRule(record, rule) {
    if (record.loanType !== rule.loanType) return true; // Rule doesn't apply
    
    const recordVal = record[rule.field];
    const threshold = Number(rule.value);
    
    if (rule.operator === '>') {
        return recordVal > threshold;
    } else if (rule.operator === '>=') {
        return recordVal >= threshold;
    } else if (rule.operator === '<') {
        return recordVal < threshold;
    } else if (rule.operator === '<=') {
        return recordVal <= threshold;
    } else if (rule.operator === '==') {
        return recordVal == threshold;
    }
    return true;
}

// Load default files on start
function loadDefaultFiles() {
    try {
        const filePrevPath = path.join(__dirname, prevFileName);
        const fileCurrPath = path.join(__dirname, currFileName);

        if (fs.existsSync(filePrevPath)) {
            prevData = parseExcelFile(filePrevPath);
            console.log(`Successfully auto-loaded previous file: ${prevFileName}`);
        } else {
            console.log(`Previous file not found at startup: ${prevFileName}`);
        }

        if (fs.existsSync(fileCurrPath)) {
            currData = parseExcelFile(fileCurrPath);
            console.log(`Successfully auto-loaded current file: ${currFileName}`);
        } else {
            console.log(`Current file not found at startup: ${currFileName}`);
        }
    } catch (err) {
        console.error('Error loading default files:', err.message);
    }
}

// REST API Endpoints

// Get current loaded datasets, stats, and calculations
app.get('/api/data', (req, res) => {
    try {
        const changes = analyzeLedgerDeltas(prevData, currData);
        
        // Evaluate rule violations
        const violations = currData.map(r => {
            const activeRules = rules.filter(rule => rule.loanType === r.loanType);
            let isViolating = false;
            let ruleMessage = '';
            
            if (activeRules.length > 0) {
                // Account violates if it fails ANY rule for its loan type
                const failedRules = activeRules.filter(rule => evaluateRule(r, rule));
                isViolating = failedRules.length > 0;
                if (isViolating) {
                    ruleMessage = failedRules.map(fr => `Missed installments > ${fr.value}`).join(', ');
                }
            }
            return {
                ...r,
                isPastDueViolation: isViolating,
                ruleMessage: ruleMessage
            };
        });

        // Unique zones and loan types
        const zones = Array.from(new Set([...prevData.map(r => r.zone), ...currData.map(r => r.zone)])).sort((a,b)=>a-b);
        const loanTypes = Array.from(new Set([...prevData.map(r => r.loanType), ...currData.map(r => r.loanType)])).sort();

        res.json({
            status: 'success',
            prevFile: prevFileName,
            currFile: currFileName,
            prevCount: prevData.length,
            currCount: currData.length,
            prevData: prevData.map(r => ({ zone: r.zone, balance: r.balance })),
            zones: zones,
            loanTypes: loanTypes,
            rules: rules,
            changes: changes,
            violations: violations
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Update/Save dynamic rules
app.post('/api/rules', (req, res) => {
    const { newRules } = req.body;
    if (!Array.isArray(newRules)) {
        return res.status(400).json({ status: 'error', message: 'Rules must be an array' });
    }
    rules = newRules;
    console.log('Updated active rules configuration:', rules);
    res.json({ status: 'success', message: 'Rules updated successfully', rules: rules });
});

// Upload new ledger files
app.post('/api/upload', upload.fields([
    { name: 'prevFile', maxCount: 1 },
    { name: 'currFile', maxCount: 1 }
]), (req, res) => {
    try {
        if (req.files['prevFile']) {
            const prevFile = req.files['prevFile'][0];
            const originalPath = path.join(__dirname, prevFile.originalname);
            try {
                // Try copying and saving to root directory
                fs.copyFileSync(prevFile.path, originalPath);
                fs.unlinkSync(prevFile.path);
                prevFileName = prevFile.originalname;
                prevData = parseExcelFile(originalPath);
                console.log(`Uploaded, copied, and parsed new previous ledger file: ${prevFileName}`);
            } catch (copyErr) {
                console.warn(`Could not overwrite root file (possibly locked by Excel). Parsing uploaded file directly.`, copyErr.message);
                prevFileName = prevFile.originalname + " (In-Memory)";
                prevData = parseExcelFile(prevFile.path);
                try { fs.unlinkSync(prevFile.path); } catch (unlinkErr) {}
                console.log(`Uploaded and parsed new previous ledger file directly in-memory: ${prevFileName}`);
            }
        }

        if (req.files['currFile']) {
            const currFile = req.files['currFile'][0];
            const originalPath = path.join(__dirname, currFile.originalname);
            try {
                // Try copying and saving to root directory
                fs.copyFileSync(currFile.path, originalPath);
                fs.unlinkSync(currFile.path);
                currFileName = currFile.originalname;
                currData = parseExcelFile(originalPath);
                console.log(`Uploaded, copied, and parsed new current ledger file: ${currFileName}`);
            } catch (copyErr) {
                console.warn(`Could not overwrite root file (possibly locked by Excel). Parsing uploaded file directly.`, copyErr.message);
                currFileName = currFile.originalname + " (In-Memory)";
                currData = parseExcelFile(currFile.path);
                try { fs.unlinkSync(currFile.path); } catch (unlinkErr) {}
                console.log(`Uploaded and parsed new current ledger file directly in-memory: ${currFileName}`);
            }
        }

        res.json({
            status: 'success',
            message: 'Files uploaded and processed successfully',
            prevFile: prevFileName,
            currFile: currFileName,
            prevCount: prevData.length,
            currCount: currData.length
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`PastDue Ledger Server running at http://localhost:${port}`);
    loadDefaultFiles();
});
