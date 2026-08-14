//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here

// Values that arrive from the browser are only ever used against these fixed
// lists. Nothing from a request is used to build a session key directly, which
// keeps the routes clear of object injection.
const JOURNEY_2_VARIANTS = ['structured', 'compare-side-by-side', 'compare-stacked']
const JOURNEY_2_SECTIONS = ['condition-history', 'medication', 'social-occupational', 'functional-history', 'mobility', 'observations']
const JOURNEY_2_ACTIVITIES = ['preparing-food', 'taking-nutrition', 'managing-therapy']

// Autosave for mid-call notes pages (Functional history and future pages).
// The prototype kit automatically stores every POSTed field into session
// data, so this route only needs to acknowledge the save. The saved fields
// (for example data['fh-notes-preparing-food']) are then available to any
// later page, such as the end of call review.
router.post('/transcription/autosave', (req, res) => {
  res.json({ saved: true })
})

// Ending the call: record the call state so every page's strip switches to
// CALL ENDED, then send the HCP to the draft summary for review.
router.post('/transcription/end-call', (req, res) => {
  req.session.data['call-state'] = 'ended'
  req.session.data['call-length'] = String(req.body['call-length'] || '03:52')
  res.redirect('/transcription/review-draft-report')
})

// Journey 1 ends by submitting the report, which goes to a confirmation page.
router.post('/transcription/submit', (req, res) => {
  req.session.data.submitted = 'yes'
  res.redirect('/transcription/submitted')
})

// Reset the prototype between user testing sessions: clears the notes, any
// edits to the draft report, and the call state, then drops you back at the
// start of the journey. Bookmark /reset and hit it between participants.
router.get('/reset', (req, res) => {
  req.session.data = {}
  res.redirect('/transcription/functional-history')
})

// ---------------------------------------------------------------------------
// Journey 2: the same note taking with alternative report and comparison UIs.
// Journey 1 is untouched — journey 2 keeps its own notes and its own state.
// ---------------------------------------------------------------------------

// The notes an HCP would have typed during the call, so a participant can
// start from a realistic mid-journey position instead of typing them first.
const journey2CallNotes = {
  'preparing-food': 'Brother does most of the cooking. Helps with peeling potatoes but tries to avoid it. On her own - heats soup, cooker or microwave. Not motivated, says she feels low.',
  'taking-nutrition': "Not eating much. Weight loss - says clothes don't fit. Not hungry, no motivation. Brother encourages balanced meals. On her own - soup or crisps. Told GP about weight loss, no referral.",
  'managing-therapy': 'Forgets meds. Brother rings and checks she has taken them. Missed several times, last about 2 weeks ago. Reckons she would miss a few times a week without the reminders.'
}

// Each index link starts the journey with one UI selected, so the HCP takes
// notes first and then meets the UI we want to test.
router.get('/journey-2/start/:variant', (req, res) => {
  const variant = JOURNEY_2_VARIANTS.indexOf(req.params.variant) === -1 ? 'structured' : req.params.variant
  req.session.data['j2-variant'] = variant
  JOURNEY_2_ACTIVITIES.forEach((activity) => {
    if (activity === 'preparing-food') req.session.data['j2-notes-preparing-food'] = journey2CallNotes['preparing-food']
    if (activity === 'taking-nutrition') req.session.data['j2-notes-taking-nutrition'] = journey2CallNotes['taking-nutrition']
    if (activity === 'managing-therapy') req.session.data['j2-notes-managing-therapy'] = journey2CallNotes['managing-therapy']
  })
  req.session.data['j2-notes-prefilled'] = 'yes'
  res.redirect('/journey-2/call-notes')
})

router.post('/journey-2/end-call', (req, res) => {
  req.session.data['j2-call-length'] = String(req.body['call-length'] || '03:52')
  res.redirect('/journey-2/draft-report')
})

// Saving from either compare UI stores the report text for that activity.
router.post('/journey-2/save-compare', (req, res) => {
  const activity = String(req.body['activity-id'] || '')
  const text = String(req.body['section-text'] || '')
  if (activity === 'preparing-food') req.session.data['j2-report-preparing-food'] = text
  if (activity === 'taking-nutrition') req.session.data['j2-report-taking-nutrition'] = text
  if (activity === 'managing-therapy') req.session.data['j2-report-managing-therapy'] = text
  res.redirect('/journey-2/draft-report')
})

// Submitting the report ends journey 2 on a confirmation page.
router.post('/journey-2/submit', (req, res) => {
  req.session.data['j2-submitted'] = 'yes'
  res.redirect('/journey-2/submitted')
})
