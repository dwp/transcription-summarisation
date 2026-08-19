//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//
 
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
 
// Add your routes here
 
const JOURNEY_2_VARIANTS = [
  'structured',
  'compare-side-by-side',
  'compare-stacked'
]
 
// Every activity that has a note box on BOTH journeys. These names must match
// the fh-notes-<id> ids in app/views/transcription/functional-history.html and
// the j2-notes-<id> ids in app/views/journey-2/call-notes.html.
const CARRIED_ACTIVITIES = [
  'preparing-food',
  'taking-nutrition',
  'managing-therapy',
  'washing-and-bathing',
  'managing-toilet-needs',
  'dressing-and-undressing',
  'communicating-verbally',
  'reading-and-understanding',
  'engaging-face-to-face',
  'budgeting',
  'planning-and-following-journeys',
  'moving-around'
]
 
const CALL_KEYS = ['call-state', 'call-length']
 
function hasText (value) {
  return typeof value === 'string' && value.trim() !== ''
}
 
function has (data, key) {
  return Object.prototype.hasOwnProperty.call(data, key)
}
 
// The kit copies session data into res.locals.data BEFORE this file runs, and
// it copies key by key rather than passing the object itself. So anything we
// change here is invisible to the page being rendered right now: it only shows
// up on the next request. That is why the notes used to need a refresh.
// Everything we touch has to be pushed into the view's copy as well.
function pushToView (res, data, keys) {
  if (!res.locals || !res.locals.data) {
    return
  }
 
  keys.forEach(function (key) {
    if (has(data, key)) {
      res.locals.data[key] = data[key]
    } else {
      delete res.locals.data[key]
    }
  })
}
 
// A box counts as touched once the participant has typed in it, even if they
// then cleared it again: autosave writes an empty string, so the key exists.
// A box nobody has ever typed in has no key at all. That is the difference
// between "left blank on purpose" and "not filled in yet".
//
// Only ever writes into an untouched box, so nothing the participant wrote is
// overwritten and nothing they deleted comes back. Empty stays empty: there is
// no mock fallback.
//
// The prefixes and activity names are fixed literals in this file. Nothing
// from a request ever builds a session key.
function carryNotes (data, fromPrefix, toPrefix) {
  let copied = 0
 
  CARRIED_ACTIVITIES.forEach(function (activity) {
    const source = data[fromPrefix + activity]
    const targetKey = toPrefix + activity
 
    if (hasText(source) && !has(data, targetKey)) {
      data[targetKey] = source
      copied = copied + 1
    }
  })
 
  return copied
}
 
// The recording strip's End call form posts a hidden call-state field, and the
// kit stores every posted field in shared session data whatever route handles
// the post. So ending the call in one journey used to end it in the other.
// Each journey keeps its own copy (j1-call-state, j2-call-state) and the shared
// keys get rewritten from that copy on every page, so each journey always shows
// its own call.
function applyCallState (data, prefix) {
  CALL_KEYS.forEach(function (key) {
    const own = data[prefix + key]
 
    if (hasText(own)) {
      data[key] = own
    } else {
      delete data[key]
    }
  })
}
 
// Runs before every page in either journey, so it does not matter which
// journey the participant starts in or which link they arrive on.
router.use(function (req, res, next) {
  if (req.method !== 'GET') {
    return next()
  }
 
  const path = String(req.originalUrl || '').split('?')[0]
  const data = req.session.data
 
  if (path.indexOf('/journey-2/') === 0) {
    if (carryNotes(data, 'fh-notes-', 'j2-notes-') > 0) {
      data['j2-notes-prefilled'] = 'yes'
    }
 
    applyCallState(data, 'j2-')
 
    pushToView(res, data, CALL_KEYS.concat(['j2-notes-prefilled'],
      CARRIED_ACTIVITIES.map(function (a) { return 'j2-notes-' + a })))
  }
 
  if (path.indexOf('/transcription/') === 0) {
    if (carryNotes(data, 'j2-notes-', 'fh-notes-') > 0) {
      data['fh-notes-prefilled'] = 'yes'
    }
 
    applyCallState(data, 'j1-')
 
    pushToView(res, data, CALL_KEYS.concat(['fh-notes-prefilled'],
      CARRIED_ACTIVITIES.map(function (a) { return 'fh-notes-' + a })))
  }
 
  next()
})
 
// Autosave for notes and report content.
router.post('/transcription/autosave', (req, res) => {
  res.json({ saved: true })
})
 
// Journey 1 -------------------------------------------------------------
 
// Kept so a link to /transcription/start still works. The carry itself
// happens in the middleware above, on whichever page you land on.
router.get('/transcription/start', (req, res) => {
  res.redirect('/transcription/functional-history')
})
 
router.post('/transcription/end-call', (req, res) => {
  const length = String(req.body['call-length'] || '03:52')
 
  req.session.data['j1-call-state'] = 'ended'
  req.session.data['j1-call-length'] = length
 
  req.session.data['call-state'] = 'ended'
  req.session.data['call-length'] = length
 
  res.redirect('/transcription/review-draft-report')
})
 
router.post('/transcription/submit', (req, res) => {
  req.session.data.submitted = 'yes'
  res.redirect('/transcription/submitted')
})
 
// Journey 2 -------------------------------------------------------------
 
router.get('/journey-2/start/:variant', (req, res) => {
  const variant = JOURNEY_2_VARIANTS.includes(req.params.variant)
    ? req.params.variant
    : 'structured'
 
  req.session.data['j2-variant'] = variant
 
  res.redirect('/journey-2/call-notes')
})
 
router.post('/journey-2/end-call', (req, res) => {
  const length = String(req.body['call-length'] || '03:52')
 
  req.session.data['j2-call-state'] = 'ended'
  req.session.data['j2-call-length'] = length
 
  // The strip's hidden call-state field has just landed in shared session data.
  // Put journey 1's call back the way it was.
  applyCallState(req.session.data, 'j1-')
 
  res.redirect('/journey-2/draft-report')
})
 
router.post('/journey-2/save-compare', (req, res) => {
  const activity = String(req.body['activity-id'] || '')
  const text = String(req.body['section-text'] || '')
 
  if (activity === 'preparing-food') {
    req.session.data['j2-report-preparing-food'] = text
  }
 
  if (activity === 'taking-nutrition') {
    req.session.data['j2-report-taking-nutrition'] = text
  }
 
  if (activity === 'managing-therapy') {
    req.session.data['j2-report-managing-therapy'] = text
  }
 
  res.redirect('/journey-2/draft-report')
})
 
router.post('/journey-2/submit', (req, res) => {
  req.session.data['j2-submitted'] = 'yes'
  res.redirect('/journey-2/submitted')
})
 
// Reset ----------------------------------------------------------------
 
// Clears the notes, the report edits and the call state, then drops you back
// on the home page so you can send the next participant into either journey.
router.get('/reset', (req, res) => {
  req.session.data = {}
  res.redirect('/')
})
 
router.get('/clear-data', function (req, res) {
  req.session.data = {}
  res.redirect('/')
})
