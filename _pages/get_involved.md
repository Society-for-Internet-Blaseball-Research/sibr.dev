---
permalink: /get-involved
title: Get Involved
---
<h2>Project Ideas</h2>
<p>Please use <a href='https://airtable.com/shrdnXOOL9bIZN6OD'>this form</a> to update our project ideas list.</p>
<div id="ideas"></div>

<h2>Research Topics</h2>
<p>Please use <a href='https://airtable.com/shrTCItwzUw8Py0fm'>this form</a> to update our research topic list.</p>

<div id="topics"></div>

<script>
    getAirtableData({
        table_name: 'Research Topics',
        'view': 'Approved',
    }).then((records) => {
        document.getElementById('topics').appendChild(processRecords(records, 'Research Topics'));
    });

    getAirtableData({
        table_name: 'Project Ideas',
        'view': 'Approved',
    }).then((records) => {
        document.getElementById('ideas').appendChild(processRecords(records, 'Project Ideas'));
    });
</script>