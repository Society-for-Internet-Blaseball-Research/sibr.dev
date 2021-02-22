var airtable_prefix = 'https://api.airtable.com/v0/appWtyQaqnacZfkM0/';

const default_options = {
    'api_key': 'keyUhNlkJCDWgcKzm' // this is a read only key so it's ok to store publicly
};

const base_class_map = {
    'Categories': 'category',
    'Roles': 'role'
};
const class_map = {
    'Categories': {
        'Viewing Live Games': 'category-view',
        'Games Analysis': 'category-analysis',
        'Betting (#betting-and-voting)': 'category-betting',
        'Miscellaneous': 'category-misc',
        'Harvesting Data (#archivism)': 'category-archivism',
        'Viewing Past Games': 'category-past-games',
        'Datablase and Clients': 'category-datablase',
        'Blaseball.com API Clients (#blaseball-api)': 'category-api',
        'Papers + Paper Accessories': 'category-paper',
        'Forbidden Knowledge': 'category-forbidden',
        'Blaseball.com Scripts and Parsers (#site-js)': 'category-scripts'
    },
    'Roles': {
        'Data Witches': 'role-backend',
        'Graphiolosophers': 'role-math',
        'Servorcerers': 'role-devops',
        'Data Alchemists': 'role-frontend',
        'Data Zealots': 'role-misc'
    }
};

marked.setOptions({
    smartLists: true,
    smartypants: true,
    gfm: true
});

function getField(record, field_name) {
    if (record[field_name]) {
        switch(field_name) {
            case 'Project Name':
            case 'Question':
            case 'Name':
                return `<h2>${record[field_name]}</h2>`;
            case 'Iddea':
                return `<div>${record[field_name]}</div>`;
            case 'Site':
            case 'Code':
            case 'Project Board / Tasks':
                return `<li><a href='${record[field_name]}'>${field_name}</a></li>`;
            case 'Link':
            case 'Base URL':
            case 'Docs Link':
                return `<div>${field_name}: <a href='${record[field_name]}'>${record[field_name]}</a></div>`;
            case 'Answer':
            case 'Description':
                return marked(record[field_name]);
            case 'Roles':
            case 'Categories':
                return `<span class='properties'>
                    ${record[field_name].split(',')
                        .map(entry => `<span class='${base_class_map[field_name]} ${class_map[field_name][entry.trim()]}'>${entry}</span>`)
                        .join('')}
                </span>`;
            case 'Contributors':
                return `<div>Contributors: ${record[field_name]}</div>`;
            default:
                return record[field_name];
        }
    }
    return '';
}

function getAirtableData(options) {
    const {
        table_name,
        ...airtable_options
    } = options;

    const all_options = Object.assign({}, default_options, airtable_options);

    return axios
        .get(airtable_prefix + table_name + '?' + new URLSearchParams(all_options).toString())
        .then(function(result) {
            if (result && result.data && result.data.records) {
                return result.data.records.map(record => record.fields);
            }
        }); 
}

function processRecords(records, type) {
    const showList = type === 'Falsehoods' || type === 'Project Ideas' || type === 'Research Topics';
    const outputDiv = showList ? document.createElement('ol') : document.createElement('div');

    records.forEach((record) => {
        const recordDiv = showList ? document.createElement('li') : document.createElement('div');
        const recordOutput = [];

        switch(type) {
            case 'Falsehoods':
                const falsehood = record['Citation'] ? 
                    `<a href='${record['Citation']}'>${getField(record, 'Falsehood')}</a>` : getField(record, 'Falsehood');
                recordOutput.push(falsehood);
                break;
            case 'Research Topics':
                recordOutput.push(getField(record, 'Topic'));
                recordOutput.push(getField(record, 'Roles'));
                break;
            case 'Project Ideas':
                recordOutput.push(getField(record, 'Idea'));
                recordOutput.push(getField(record, 'Roles'));
                break;
            case 'FAQ':
                recordOutput.push(getField(record, 'Question'));
                recordOutput.push(getField(record, 'Answer'));
                break;
            case 'APIs':
                recordOutput.push(getField(record, 'Name'));
                recordOutput.push(getField(record, 'Description'));
                recordOutput.push(getField(record, 'Base URL'));
                recordOutput.push(getField(record, 'Docs Link'));
                break;
            case 'Projects':
                recordDiv.className = record['Major Project'] ? 'project project-major' : 'project';
                recordOutput.push('<div class=\'project-title\'>');
                recordOutput.push(getField(record, 'Project Name'));
                recordOutput.push(getField(record, 'Categories'));
                recordOutput.push('</div>');
                recordOutput.push(getField(record, 'Contributors'));
                recordOutput.push(getField(record, 'Description'));
                recordOutput.push('<ul>');
                recordOutput.push(getField(record, 'Site'));
                recordOutput.push(getField(record, 'Code'));
                recordOutput.push(getField(record, 'Project Board / Tasks'));
                recordOutput.push('</ul>');
                break;
        }
        recordDiv.innerHTML = recordOutput.join('\n');
        outputDiv.appendChild(recordDiv);
    });

    return outputDiv;
}
