const fs = require('fs');
const pdf = require('pdf-parse/lib/pdf-parse.js');

const dataBuffer = fs.readFileSync('/Users/manideep/Desktop/website/lms-app/QUIZ.pdf');

pdf(dataBuffer).then(function (data) {
    console.log('--- START OF PDF TEXT ---');
    console.log(data.text);
    console.log('--- END OF PDF TEXT ---');
}).catch(err => {
    console.error('Error parsing PDF:', err);
});
