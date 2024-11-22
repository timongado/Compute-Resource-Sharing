;; Decentralized Compute Resource Sharing

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-already-exists (err u103))
(define-constant err-invalid-amount (err u104))
(define-constant err-insufficient-balance (err u105))

;; Data Maps
(define-map providers
  { provider: principal }
  {
    resources: uint,
    price-per-unit: uint,
    earnings: uint
  }
)

(define-map consumers
  { consumer: principal }
  {
    balance: uint
  }
)

(define-map active-jobs
  { job-id: uint }
  {
    consumer: principal,
    provider: principal,
    resources: uint,
    total-cost: uint,
    status: (string-ascii 20)
  }
)

;; Variables
(define-data-var last-job-id uint u0)

;; Private Functions
(define-private (is-owner)
  (is-eq tx-sender contract-owner)
)

;; Public Functions
(define-public (register-provider (resources uint) (price-per-unit uint))
  (let
    (
      (existing-provider (map-get? providers { provider: tx-sender }))
    )
    (asserts! (is-none existing-provider) err-already-exists)
    (map-set providers
      { provider: tx-sender }
      {
        resources: resources,
        price-per-unit: price-per-unit,
        earnings: u0
      }
    )
    (ok true)
  )
)

(define-public (update-provider (resources uint) (price-per-unit uint))
  (let
    (
      (existing-provider (unwrap! (map-get? providers { provider: tx-sender }) err-not-found))
    )
    (map-set providers
      { provider: tx-sender }
      (merge existing-provider
        {
          resources: resources,
          price-per-unit: price-per-unit
        }
      )
    )
    (ok true)
  )
)

(define-public (add-funds (amount uint))
  (let
    (
      (consumer-data (default-to { balance: u0 } (map-get? consumers { consumer: tx-sender })))
    )
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set consumers
      { consumer: tx-sender }
      { balance: (+ (get balance consumer-data) amount) }
    )
    (ok true)
  )
)

(define-public (request-compute (provider principal) (resources uint))
  (let
    (
      (provider-data (unwrap! (map-get? providers { provider: provider }) err-not-found))
      (consumer-data (default-to { balance: u0 } (map-get? consumers { consumer: tx-sender })))
      (total-cost (* resources (get price-per-unit provider-data)))
      (new-job-id (+ (var-get last-job-id) u1))
    )
    (asserts! (>= (get resources provider-data) resources) err-invalid-amount)
    (asserts! (>= (get balance consumer-data) total-cost) err-insufficient-balance)
    (map-set active-jobs
      { job-id: new-job-id }
      {
        consumer: tx-sender,
        provider: provider,
        resources: resources,
        total-cost: total-cost,
        status: "active"
      }
    )
    (map-set providers
      { provider: provider }
      (merge provider-data
        { resources: (- (get resources provider-data) resources) }
      )
    )
    (map-set consumers
      { consumer: tx-sender }
      { balance: (- (get balance consumer-data) total-cost) }
    )
    (var-set last-job-id new-job-id)
    (ok new-job-id)
  )
)

(define-public (complete-job (job-id uint))
  (let
    (
      (job (unwrap! (map-get? active-jobs { job-id: job-id }) err-not-found))
      (provider-data (unwrap! (map-get? providers { provider: (get provider job) }) err-not-found))
    )
    (asserts! (is-eq (get provider job) tx-sender) err-unauthorized)
    (asserts! (is-eq (get status job) "active") err-unauthorized)
    (map-set active-jobs
      { job-id: job-id }
      (merge job { status: "completed" })
    )
    (map-set providers
      { provider: tx-sender }
      (merge provider-data
        {
          resources: (+ (get resources provider-data) (get resources job)),
          earnings: (+ (get earnings provider-data) (get total-cost job))
        }
      )
    )
    (ok true)
  )
)

(define-public (withdraw-earnings)
  (let
    (
      (provider-data (unwrap! (map-get? providers { provider: tx-sender }) err-not-found))
      (earnings (get earnings provider-data))
    )
    (asserts! (> earnings u0) err-invalid-amount)
    (try! (as-contract (stx-transfer? earnings tx-sender tx-sender)))
    (map-set providers
      { provider: tx-sender }
      (merge provider-data { earnings: u0 })
    )
    (ok earnings)
  )
)

;; Read-only Functions
(define-read-only (get-provider-data (provider principal))
  (map-get? providers { provider: provider })
)

(define-read-only (get-consumer-balance (consumer principal))
  (default-to { balance: u0 } (map-get? consumers { consumer: consumer }))
)

(define-read-only (get-job-details (job-id uint))
  (map-get? active-jobs { job-id: job-id })
)
