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

// Autosave for notes and report content.
router.post('/transcription/autosave', (req, res) => {
  res.json({ saved: true })
})

// Journey 1 -------------------------------------------------------------

router.post('/transcription/end-call', (req, res) => {
  req.session.data['call-state'] = 'ended'
  req.session.data['call-length'] = String(req.body['call-length'] || '03:52')

  res.redirect('/transcription/review-draft-report')
})

router.post('/transcription/submit', (req, res) => {
  req.session.data.submitted = 'yes'
  res.redirect('/transcription/submitted')
})

// Reset ----------------------------------------------------------------

router.get('/reset', (req, res) => {
  req.session.data = {}
  res.redirect('/transcription/functional-history')
})

// Journey 2 -------------------------------------------------------------

const journey2CallNotes = {
  'preparing-food':
    'Brother does most of the cooking. Helps with peeling potatoes but tries to avoid it. On her own - heats soup, cooker or microwave. Not motivated, says she feels low.',

  'taking-nutrition':
    "Not eating much. Weight loss - says clothes don't fit. Not hungry, no motivation. Brother encourages balanced meals. On her own - soup or crisps. Told GP about weight loss, no referral.",

  'managing-therapy':
    'Forgets meds. Brother rings and checks she has taken them. Missed several times, last about 2 weeks ago. Reckons she would miss a few times a week without the reminders.'
}

router.get('/journey-2/start/:variant', (req, res) => {
  const variant = JOURNEY_2_VARIANTS.includes(req.params.variant)
    ? req.params.variant
    : 'structured'

  req.session.data['j2-variant'] = variant

  Object.entries(journey2CallNotes).forEach(([activity, notes]) => {
    req.session.data[`j2-notes-${activity}`] = notes
  })

  req.session.data['j2-notes-prefilled'] = 'yes'

  res.redirect('/journey-2/call-notes')
})

router.post('/journey-2/end-call', (req, res) => {
  req.session.data['j2-call-length'] = String(
    req.body['call-length'] || '03:52'
  )

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
router.get('/clear-data', function (req, res) {
  req.session.data = {}
  res.redirect('/')
})