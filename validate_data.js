const http = require('http');

function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${data.slice(0, 100)}`));
                }
            });
        }).on('error', err => {
            reject(err);
        });
    });
}

function postJson(url, body) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const postData = JSON.stringify(body);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 80,
            path: parsedUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ status: 'error', message: 'Parse error' });
                }
            });
        });
        req.on('error', err => { reject(err); });
        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('Starting programmatic validation tests against http://localhost:3000 ...');
    
    try {
        // Reset rules to standard defaults to ensure test independence
        await postJson('http://localhost:3000/api/rules', {
            newRules: [
                {
                    loanType: 'Isuru Loan (ඉසුරු ණය)',
                    field: 'installments',
                    operator: '>',
                    value: 3
                }
            ]
        });

        const data = await getJson('http://localhost:3000/api/data');
        
        console.log('\n--- API Integration Verification ---');
        console.log(`Connection: SUCCESS`);
        console.log(`Prev File loaded: ${data.prevFile} (${data.prevCount} records)`);
        console.log(`Curr File loaded: ${data.currFile} (${data.currCount} records)`);
        
        // Assertions
        console.log('\n--- Running Assertions ---');
        
        let failures = 0;
        const assert = (condition, message) => {
            if (condition) {
                console.log(`[PASS] ${message}`);
            } else {
                console.error(`[FAIL] ${message}`);
                failures++;
            }
        };

        assert(data.status === 'success', 'Status is success');
        assert(data.prevCount === 1238, 'Prev ledger has 1238 records');
        assert(data.currCount === 1279, 'Curr ledger has 1279 records');
        assert(data.zones.length === 8, '8 unique zones detected (0 to 7)');
        assert(data.zones.includes(4), 'Zone 4 is present');
        assert(data.loanTypes.includes('Isuru Loan (ඉසුරු ණය)'), 'Isuru Loan is canonicalized');
        
        // Rules assertions
        assert(data.rules.length === 1, '1 default rule is active');
        assert(data.rules[0].loanType === 'Isuru Loan (ඉසුරු ණය)', 'Default rule applies to Isuru Loan');
        assert(data.rules[0].value === 3, 'Default Isuru Loan threshold is > 3 installments');

        // Changes stats assertions
        const changes = data.changes;
        const newPastDue = changes.filter(c => c.type === 'NEW_PAST_DUE').length;
        const cleared = changes.filter(c => c.type === 'CLEARED').length;
        const decreased = changes.filter(c => c.type === 'AMOUNT_DECREASED').length;
        const increased = changes.filter(c => c.type === 'AMOUNT_INCREASED').length;
        const noChange = changes.filter(c => c.type === 'NO_CHANGE').length;
        
        console.log(`\nDelta stats computed:`);
        console.log(`- New Past Due: ${newPastDue}`);
        console.log(`- Cleared: ${cleared}`);
        console.log(`- Arrears Decreased: ${decreased}`);
        console.log(`- Arrears Increased: ${increased}`);
        console.log(`- No Change: ${noChange}`);

        assert(newPastDue === 89, 'Calculated exactly 89 new past due accounts');
        assert(cleared === 48, 'Calculated exactly 48 cleared accounts');
        assert(decreased === 580, 'Calculated exactly 580 decreased accounts');
        assert(increased === 33, 'Calculated exactly 33 increased accounts');
        assert(noChange === 577, 'Calculated exactly 577 no change accounts');

        // Zone 4 specific assertions
        const zone4Changes = changes.filter(c => Number(c.zone) === 4);
        const z4New = zone4Changes.filter(c => c.type === 'NEW_PAST_DUE').length;
        const z4Cleared = zone4Changes.filter(c => c.type === 'CLEARED').length;
        const z4Decreased = zone4Changes.filter(c => c.type === 'AMOUNT_DECREASED').length;
        const z4Increased = zone4Changes.filter(c => c.type === 'AMOUNT_INCREASED').length;
        
        console.log(`\nZone 4 specific stats:`);
        console.log(`- Zone 4 Total Changes: ${zone4Changes.length}`);
        console.log(`- Zone 4 New: ${z4New}`);
        console.log(`- Zone 4 Cleared: ${z4Cleared}`);
        console.log(`- Zone 4 Decreased: ${z4Decreased}`);
        console.log(`- Zone 4 Increased: ${z4Increased}`);

        assert(z4New === 10, 'Zone 4 has exactly 10 new past due accounts');
        assert(z4Cleared === 3, 'Zone 4 has exactly 3 cleared accounts');
        assert(z4Decreased === 72, 'Zone 4 has exactly 72 decreased accounts');
        assert(z4Increased === 2, 'Zone 4 has exactly 2 increased accounts');

        // Violations evaluation
        const currentIsuru = data.violations.filter(v => v.loanType === 'Isuru Loan (ඉසුරු ණය)');
        const isuruViolators = currentIsuru.filter(v => v.isPastDueViolation);
        console.log(`\nIsuru Overdue rules evaluation:`);
        console.log(`- Current Isuru Loans: ${currentIsuru.length}`);
        console.log(`- Overdue Isuru (missed > 3): ${isuruViolators.length}`);
        
        assert(currentIsuru.length === 127, 'Total active Isuru loans is 127');
        assert(isuruViolators.length === 10, 'Total Isuru rule violations is exactly 10');

        console.log(`\n======================================`);
        if (failures === 0) {
            console.log('ALL TESTS PASSED SUCCESSFULLY! ✅');
            process.exit(0);
        } else {
            console.error(`TEST RUN COMPLETED WITH ${failures} FAILURE(S)! ❌`);
            process.exit(1);
        }
    } catch (err) {
        console.error('Test run crashed:', err.message);
        console.error('Make sure the server is running on http://localhost:3000 before executing tests.');
        process.exit(1);
    }
}

runTests();
