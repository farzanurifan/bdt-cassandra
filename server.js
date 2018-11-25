
// Farza Nurifan

// Import
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
var express = require('express');
const partials = require('express-partials')
var http = require('http');
var cassandra = require('cassandra-driver');

// EJS view variables
const pageItem = 10 // Items per page on table
const fields = [
    'country', 'Happiness.Rank', 'Happiness.Score', 'Whisker.high', 'Whisker.low', 'Economy..GDP.per.Capita.',
    'Family', 'Health..Life.Expectancy.', 'Freedom', 'Generosity', 'Trust..Government.Corruption.', 'Dystopia.Residual'
]

// Log
const logError = (err) => { if (err) return console.log(err) }
const logMessage = (message) => console.log(message)

const client = new cassandra.Client({ contactPoints: ['192.168.33.200:9042'], keyspace: 'bdt' });
client.connect((err, result) => {
    if (err) console.log(err)
})

// all environments
var app = express();
app.set('port', 3000);
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');
app.use(partials())

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


// Routing //

app.get('/', (req, res) => res.redirect('/page/1'))

app.get('/page/:page', (req, res) => {
    var query = 'SELECT * FROM happiness LIMIT'
    var page = Number(req.params.page)
    var paginate = pagination(155, page)
    client.execute(query, [], (err, results) => {
        console.log('haha', results)
        res.render('index.ejs', { results: results.rows, page, ...paginate, fields })
    })
})

// app.get('/add', (req, res) => res.render('add.ejs', { fields }))

// app.post('/create', (req, res) => {
//     db.collection(table).save(req.body, (err, result) => {
//         logError(err)
//         logMessage('saved to database')
//         res.redirect('/')
//     })
// })

// app.get('/edit/:id', (req, res) => {
//     var id = ObjectId(req.params.id)
//     db.collection(table).find(id).toArray((err, results) => {
//         result = results[0]
//         res.render('edit.ejs', { result, fields })
//     })
// })

// app.put('/update/:id', (req, res) => {
//     var id = ObjectId(req.params.id)
//     db.collection(table).updateOne({ _id: id }, { $set: req.body }, (err, result) => {
//         logError(err)
//         logMessage('updated to database')
//         res.redirect('/')
//     })
// })

// app.delete('/delete/:id', (req, res) => {
//     var id = ObjectId(req.params.id)
//     db.collection(table).deleteOne({ _id: id }, (err, result) => {
//         logError(err)
//         logMessage('deleted from database')
//         res.redirect('/')
//     })
// })

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});