// Simple test script to verify LLM functionality
const fetch = require('node-fetch');

async function testLLM() {
    try {
        console.log('Testing LLM API...');

        // Test 1: Check capabilities
        console.log('\n1. Testing capabilities endpoint...');
        const capabilitiesResponse = await fetch('http://localhost:3000/api/llm/capabilities');
        const capabilities = await capabilitiesResponse.json();
        console.log('Capabilities:', JSON.stringify(capabilities, null, 2));

        // Test 2: Check service status
        console.log('\n2. Testing service status...');
        const statusResponse = await fetch('http://localhost:3000/api/llm/status');
        const status = await statusResponse.json();
        console.log('Status:', JSON.stringify(status, null, 2));

        // Test 3: Test summarize action
        console.log('\n3. Testing summarize action...');
        const summarizeResponse = await fetch('http://localhost:3000/api/llm/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'summarize',
                input: 'This is a test text to summarize. It contains multiple sentences and should be processed by the Gemini AI service to generate a concise summary.',
                model: 'gemini-1.5-flash',
                service: 'gemini'
            })
        });

        if (summarizeResponse.ok) {
            const summarizeResult = await summarizeResponse.json();
            console.log('Summarize Result:', JSON.stringify(summarizeResult, null, 2));
        } else {
            const error = await summarizeResponse.text();
            console.error('Summarize Error:', error);
        }

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Run the test
testLLM();

