
// Farza Nurifan

// Import
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
var express = require('express');
const partials = require('express-partials')
var http = require('http');
var cassandra = require('cassandra-driver');

// Express config
var app = express();
app.set('port', 3000);
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');
app.use(partials())

// Cassandra config
var address = '192.168.33.200:9042'
var keyspace = 'bdt'

// Connect cassandra
const client = new cassandra.Client({ contactPoints: [address], keyspace });
client.connect((err, result) => { if (err) console.log(err) })

// EJS view variables
const pageItem = 10 // Items per page on table
const fields = [
    'country', 'Happiness.Rank', 'Happiness.Score', 'Whisker.high', 'Whisker.low', 'Economy..GDP.per.Capita.',
    'Family', 'Health..Life.Expectancy.', 'Freedom', 'Generosity', 'Trust..Government.Corruption.', 'Dystopia.Residual'
]

// Log
const logError = (err) => { if (err) return console.log(err) }
const logMessage = (message) => console.log(message)

// Table pagination settings
const pagination = (results, page) => {
    var pages = Math.ceil(results / pageItem)
    let first = 2
    let last = 9
    if (pages <= 11) {
        last = pages - 1
    }
    else if (page > 6 && !(page > pages - 6)) {
        first = page - 3
        last = page + 3
    }
    else if (page > pages - 6) {
        first = pages - 8
        last = pages - 1
    }
    return { pages, first, last }
}

// Query
const stringFields = `country,"Happiness.Rank","Happiness.Score","Whisker.high","Whisker.low","Economy..GDP.per.Capita.","Family","Health..Life.Expectancy.","Freedom","Generosity","Trust..Government.Corruption.","Dystopia.Residual"`
const insertQuery = input => `'${input['country']}', '${input['Happiness.Rank']}', '${input['Happiness.Score']}', '${input['Whisker.high']}', '${input['Whisker.low']}', '${input['Economy..GDP.per.Capita.']}', '${input['Family']}', '${input['Health..Life.Expectancy.']}', '${input['Freedom']}', '${input['Generosity']}', '${input['Trust..Government.Corruption.']}', '${input['Dystopia.Residual']}'`
const updateQuery = input => `"Happiness.Rank" = '${input['Happiness.Rank']}',"Happiness.Score" = '${input['Happiness.Score']}',"Whisker.high" = '${input['Whisker.high']}',"Whisker.low" = '${input['Whisker.low']}',"Economy..GDP.per.Capita." = '${input['Economy..GDP.per.Capita.']}',"Family" = '${input['Family']}',"Health..Life.Expectancy." = '${input['Health..Life.Expectancy.']}',"Freedom" = '${input['Freedom']}',"Generosity" = '${input['Generosity']}',"Trust..Government.Corruption." = '${input['Trust..Government.Corruption.']}',"Dystopia.Residual" = '${input['Dystopia.Residual']}'`

// Routing //

app.get('/', (req, res) => res.redirect('/page/1'))

app.get('/page/:page', (req, res) => {
    var query = 'SELECT * FROM happiness'
    var page = Number(req.params.page)
    client.execute(query, [], (err, results) => {
        logError(err)
        var paginate = pagination(results.rowLength, page)
        var slicer = pageItem * (page - 1)
        var newRes = results.rows.slice(slicer, slicer + 10)
        res.render('index.ejs', { results: newRes, page, ...paginate, fields, search: false, query: '' })
    })
})

app.get('/add', (req, res) => res.render('add.ejs', { fields }))

app.post('/create', (req, res) => {
    var input = req.body;
    var query = `INSERT INTO happiness (${stringFields}) VALUES (${insertQuery(input)})`
    client.execute(query, [], (err, results) => {
        logError(err)
        logMessage('saved to database')
        res.redirect('/')
    })
})

app.get('/edit/:id', (req, res) => {
    var id = req.params.id
    var query = `SELECT * FROM happiness WHERE country = '${id}'`
    client.execute(query, [], (err, results) => {
        logError(err)
        result = results.rows[0]
        res.render('edit.ejs', { result, fields })
    })
})

app.put('/update/:id', (req, res) => {
    var id = req.params.id
    var input = req.body
    var query = `UPDATE happiness SET ${updateQuery(input)} WHERE country = '${id}'`
    client.execute(query, [], (err, results) => {
        logError(err)
        logMessage('updated to database')
        res.redirect('/')
    })
})

app.delete('/delete/:id', (req, res) => {
    var id = req.params.id
    var query = `DELETE FROM happiness WHERE country = '${id}'`
    client.execute(query, [], (err, results) => {
        logError(err)
        logMessage('deleted from database')
        res.redirect('/')
    })
})

app.post('/search', (req, res) => {
    var search = req.body.search
    res.redirect(`/search/${search}/page/1`)
})

app.get('/search/:search/page/:page', (req, res) => {
    var page = Number(req.params.page)
    var search = req.params.search
    var query = `SELECT * FROM happiness WHERE country = '${search}'`
    client.execute(query, [], (err, results) => {
        logError(err)
        var paginate = pagination(results.rowLength, page)
        var slicer = pageItem * (page - 1)
        var newRes = results.rows.slice(slicer, slicer + 10)
        res.render('index.ejs', { results: newRes, page, ...paginate, fields, search: true, query: search })
    })
})

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});