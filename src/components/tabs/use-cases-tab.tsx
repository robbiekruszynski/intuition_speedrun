'use client'

import { useState } from 'react'

export function UseCasesTab() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const useCases = [
    {
      category: 'curation',
      title: 'List Curation & Ranking Systems',
      description: 'Decentralized system to verify, curate, and rank content across various domains using collective insights.',
      examples: [
        'Web3 Ecosystem: Curate trusted DeFi protocols, NFT communities, and web3 games',
        'Music: Rank top and emerging artists through collective insights',
        'Movies & Podcasts: Lists driven by user attestations on quality and relevance',
        'Top Memecoins: Navigate the memecoin space with user-backed recommendations',
        'Sports: Gain insights on sports, athletes, and predictions, curated by the community',
        'News & Research: Discover the most validated news and research articles',
        'Digital Applications: Discover top-notch digital apps, as endorsed by users',
        'Consumer Products: Find top-rated consumer products based on collective validation',
        'Education & Learning: Explore renowned platforms and institutions',
        'Travel: Uncover popular travel destinations through collective recommendations'
      ],
      benefits: ['Collective wisdom', 'Transparent ranking', 'Community-driven curation', 'Verification and authenticity'],
      sdkFeatures: ['Atom creation', 'Triple relationships', 'Attestation systems']
    },
    {
      category: 'social',
      title: 'Community-Owned Social Platforms',
      description: 'Transform traditional social platforms into community-owned spaces with advanced attestation systems.',
      examples: [
        'Advanced Signaling: Transform up-vote/down-vote into rich attestations',
        'Collective Verification: Mobilize community to attest content accuracy',
        'Member Credibility: Rank members based on track record and expertise',
        'Content Display: Systematically showcase threads and answers',
        'Information Integrity: Ensure answers and discussions are accurate'
      ],
      benefits: ['User data ownership', 'Rich feedback systems', 'Community verification', 'Transparent reputation'],
      sdkFeatures: ['User profile atoms', 'Relationship triples', 'Attestation vaults']
    },
    {
      category: 'ratings',
      title: 'Incentivized Ratings & Reviews',
      description: 'Move beyond simple star ratings to comprehensive attestation-backed review systems.',
      examples: [
        'Attestation-Backed Ratings: Comprehensive and verified experiences',
        'Community-Driven Trustworthiness: Community members vouch for reviews',
        'Dynamic Feedback Spectrum: Wide range of sentiments beyond binary',
        'Transparent Reviewer Profiles: Validate reviewer authenticity and expertise',
        'Review Aggregation & Insights: Generate summary insights from reviews'
      ],
      benefits: ['Verified reviews', 'Community trust', 'Comprehensive feedback', 'Fraud reduction'],
      sdkFeatures: ['Review atoms', 'Attestation triples', 'Reputation vaults']
    },
    {
      category: 'qa',
      title: 'Q&A Platform Moderation and Credibility',
      description: 'Build credible Q&A platforms with expert verification and community validation.',
      examples: [
        'Claiming Expertise: Users self-identify areas of knowledge',
        'Community Attestations: Peer validation of answers',
        'Verification: Answer validation reinforced by crowd wisdom',
        'Reputation Building: Continuous positive attestations build trust'
      ],
      benefits: ['Expert verification', 'Quality assurance', 'Community validation', 'Reputation systems'],
      sdkFeatures: ['Expert atoms', 'Answer triples', 'Credibility vaults']
    },
    {
      category: 'reputation',
      title: 'Reputation Scores',
      description: 'Decentralized reputation systems for trust and credibility assessment.',
      examples: [
        'Trustworthiness Index: Evaluate entities based on track record',
        'Platform Credibility: Prioritize platforms with proven expertise',
        'Credit Scoring: Decentralized credit scores with blockchain transparency',
        'Lending Confidence: Empower undercollateralized loans with reputation'
      ],
      benefits: ['Transparent reputation', 'Immutable records', 'Decentralized scoring', 'Risk assessment'],
      sdkFeatures: ['Reputation atoms', 'Credit triples', 'Trust vaults']
    },
    {
      category: 'referrals',
      title: 'Referrals',
      description: 'Streamline discovery of top-quality products, services, or talent using community-driven referrals.',
      examples: [
        'Bounty Set-Up: Organizations define rewards for specific referrals',
        'Referral Submission: Individuals recommend potential matches',
        'Verification: Recommendations undergo checks and attestations',
        'Reward Payout: Successful referrals receive designated rewards',
        'Reputation Metrics: Successful referrals enhance user reputation',
        'Tiered Incentives: Increased rewards for consistent quality'
      ],
      benefits: ['Quality discovery', 'Incentivized referrals', 'Verified recommendations', 'Reputation building'],
      sdkFeatures: ['Referral atoms', 'Bounty triples', 'Reward vaults']
    },
    {
      category: 'verification',
      title: 'Verification for Data, Information, News, Smart Contracts',
      description: 'Decentralized verification systems for any type of data or information.',
      examples: [
        'Decentralized Information Validation: Verify accuracy and authenticity',
        'Curator & Auditor Recognition: Rank individuals based on proficiency',
        'Structured Display: Present data methodically by validators',
        'Authenticity Assurance: Guarantee accuracy and integrity'
      ],
      benefits: ['Data verification', 'Expert recognition', 'Structured organization', 'Authenticity assurance'],
      sdkFeatures: ['Data atoms', 'Verification triples', 'Audit vaults']
    },
    {
      category: 'fraud',
      title: 'Fraud Protection',
      description: 'Global contributor network using gamification to monitor and validate potential fraudulent activities.',
      examples: [
        'Global Contributor Network: Worldwide team monitoring fraud',
        'Interactive Monitoring: Gaming mechanisms for incentivized monitoring',
        'Crowdsourced Vigilance: Global team tracking potential threats',
        'Trustworthiness Framework: Rigorous systems evaluating legitimacy',
        'Verification Systems: Stringent procedures for authentication'
      ],
      benefits: ['Global monitoring', 'Gamified incentives', 'Crowdsourced vigilance', 'Fraud prevention'],
      sdkFeatures: ['Fraud atoms', 'Monitoring triples', 'Protection vaults']
    },
    {
      category: 'qa',
      title: 'Crowd-Sourced Quality Assurance',
      description: 'Harness collective wisdom to assess and improve product quality.',
      examples: [
        'Community Evaluation: Collective assessment of products and features',
        'Feedback Systems: Transparent, real-time feedback mechanisms',
        'Ranking Platforms: Evaluate QA platforms based on effectiveness',
        'Product Excellence: Community-driven quality benchmarks'
      ],
      benefits: ['Community evaluation', 'Real-time feedback', 'Quality improvement', 'Transparent processes'],
      sdkFeatures: ['Quality atoms', 'Feedback triples', 'Assessment vaults']
    },
    {
      category: 'oracle',
      title: 'Oracle-Based Community Insight',
      description: 'Leverage collective intelligence for data-driven insights and predictions.',
      examples: [
        'Question Propagation: Pose questions to the community',
        'Attestation-Driven Responses: Credible answers with attestations',
        'Criteria-Based Aggregation: Multiple criteria within singular context',
        'Consensus Result Extraction: Final answers based on aggregated attestations'
      ],
      benefits: ['Collective intelligence', 'Credible responses', 'Multi-criteria analysis', 'Consensus building'],
      sdkFeatures: ['Oracle atoms', 'Insight triples', 'Prediction vaults']
    },
    {
      category: 'moderation',
      title: 'Crowdsourced Moderation & Safety',
      description: 'User-driven safeguarding and moderation systems for platform safety.',
      examples: [
        'User-Driven Safeguarding: Platform members report unsafe activities',
        'Moderation Ratings: Assign ratings to moderators based on performance',
        'Cross-Platform History: View reputation across different platforms',
        'Transparent Review Systems: Review and comment on moderation actions',
        'Collaborative Moderation: Community collaboration in content moderation'
      ],
      benefits: ['User-driven safety', 'Accountable moderation', 'Cross-platform reputation', 'Transparent review'],
      sdkFeatures: ['Safety atoms', 'Moderation triples', 'Accountability vaults']
    },
    {
      category: 'business',
      title: 'Business, Employment & Consulting Platforms',
      description: 'Professional credibility and expertise verification for business platforms.',
      examples: [
        'Professional Credibility: Evaluate authenticity of individuals and organizations',
        'Expertise Showcase: Verify skills, experiences, and specializations',
        'Credential-Based Products: Platforms enhanced with reputation systems',
        'Collaborative Experiences: Attest to quality and outcomes',
        'Consultation Metrics: Measure impact and effectiveness of services',
        'Transparent Feedback Loop: Client feedback for continuous improvement'
      ],
      benefits: ['Professional verification', 'Expertise matching', 'Credential validation', 'Quality assurance'],
      sdkFeatures: ['Professional atoms', 'Expertise triples', 'Credential vaults']
    },
    {
      category: 'voting',
      title: 'Verified Voting',
      description: 'Secure and transparent voting systems with identity assurance and reputation-based power.',
      examples: [
        'Identity Assurance: Verified identity tied to each vote',
        'Hackathon Judging: Accurate community votes for fair competition',
        'DAO Proposal Voting: Permissionless executions with community consensus',
        'Vote Attestation: Community verification of voting results',
        'Reputation-Based Voting Power: Weight votes based on credibility'
      ],
      benefits: ['Identity verification', 'Fair competition', 'Community consensus', 'Reputation-based power'],
      sdkFeatures: ['Voting atoms', 'Identity triples', 'Consensus vaults']
    },
    {
      category: 'trading',
      title: 'Trading Knowledge',
      description: 'Evaluate and rank traders, platforms, and investment assets using community-driven insights.',
      examples: [
        'Trader Credibility: Evaluate based on historical decisions and profitability',
        'Platform Assessment: Rank trading platforms using community reviews',
        'Asset Trustworthiness: Determine trustworthiness through community ratings',
        'Performance Benchmarks: Historical performance and security protocols'
      ],
      benefits: ['Trader evaluation', 'Platform ranking', 'Asset assessment', 'Performance tracking'],
      sdkFeatures: ['Trading atoms', 'Performance triples', 'Asset vaults']
    },
    {
      category: 'predictions',
      title: 'Verifiable Predictions, Claims & Forecasting',
      description: 'Measure and acknowledge individuals proficient in accurate predictions across diverse domains.',
      examples: [
        'Prediction Measurement: Acknowledge individuals with accurate predictions',
        'Accuracy Assessment: Historical forecasts and real-world outcomes',
        'Trusted Voices: Elevate consistently accurate forecasters',
        'Expertise Recognition: Emphasize expertise within the community'
      ],
      benefits: ['Prediction tracking', 'Accuracy measurement', 'Expert recognition', 'Forecast validation'],
      sdkFeatures: ['Prediction atoms', 'Accuracy triples', 'Forecast vaults']
    },
    {
      category: 'tooling',
      title: 'Data Visualizations',
      description: 'Intuitive exploration and visualization of attestations for comprehensive ecosystem insights.',
      examples: [
        'Attestation Visualization: Comprehensive insight into the Intuition ecosystem',
        'Interactive Dashboards: Real-time data exploration',
        'Trend Analysis: Historical pattern recognition',
        'Community Insights: Collective behavior visualization'
      ],
      benefits: ['Visual insights', 'Interactive exploration', 'Trend analysis', 'Community understanding'],
      sdkFeatures: ['Visualization atoms', 'Data triples', 'Insight vaults']
    },
    {
      category: 'tooling',
      title: 'Programmatic Attestations',
      description: 'Automated and programmatic attestation systems for seamless integration.',
      examples: [
        'GitHub Integration: Transform GitHub contributions into attestations',
        'ZK-Proof Attestations: Privacy-preserving attestations',
        'Merkle Structures: Efficient and secure verification',
        'Attestation-based Dynamic NFTs: NFTs based on attestation data (ERC-6651)'
      ],
      benefits: ['Automated attestations', 'Privacy preservation', 'Efficient verification', 'Dynamic NFTs'],
      sdkFeatures: ['Programmatic atoms', 'Integration triples', 'Automation vaults']
    }
  ]

  const categories = [
    { id: 'all', name: 'All Use Cases', color: 'bg-gray-500' },
    { id: 'curation', name: 'Curation & Ranking', color: 'bg-purple-500' },
    { id: 'social', name: 'Social Platforms', color: 'bg-blue-500' },
    { id: 'ratings', name: 'Ratings & Reviews', color: 'bg-green-500' },
    { id: 'qa', name: 'Q&A & Quality', color: 'bg-yellow-500' },
    { id: 'reputation', name: 'Reputation', color: 'bg-red-500' },
    { id: 'referrals', name: 'Referrals', color: 'bg-indigo-500' },
    { id: 'verification', name: 'Verification', color: 'bg-pink-500' },
    { id: 'fraud', name: 'Fraud Protection', color: 'bg-orange-500' },
    { id: 'oracle', name: 'Oracle & Insights', color: 'bg-teal-500' },
    { id: 'moderation', name: 'Moderation', color: 'bg-cyan-500' },
    { id: 'business', name: 'Business & Consulting', color: 'bg-emerald-500' },
    { id: 'voting', name: 'Voting', color: 'bg-rose-500' },
    { id: 'trading', name: 'Trading', color: 'bg-amber-500' },
    { id: 'predictions', name: 'Predictions', color: 'bg-lime-500' },
    { id: 'tooling', name: 'Tooling', color: 'bg-slate-500' }
  ]

  const filteredUseCases = selectedCategory === 'all' 
    ? useCases 
    : useCases.filter(useCase => useCase.category === selectedCategory)

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.color || 'bg-gray-500'
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Real-World Use Cases</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Discover how the Intuition SDK can be used to build powerful decentralized applications across various industries. 
          Based on the official <a href="https://tech.docs.intuition.systems/use-cases" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Intuition documentation</a>.
        </p>
      </div>

      {/* Category Filter */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? `${category.color} text-white`
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Use Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredUseCases.map((useCase, index) => (
          <div key={index} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-8 hover:shadow-lg transition-all duration-200 group min-h-[400px] flex flex-col">
            {/* Category Badge */}
            <div className="flex items-center justify-between mb-6">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(useCase.category)} text-white`}>
                {categories.find(cat => cat.id === useCase.category)?.name}
              </span>
              <div className="text-3xl opacity-60 group-hover:opacity-100 transition-opacity">
                {useCase.category === 'curation' && ''}
                {useCase.category === 'social' && ''}
                {useCase.category === 'ratings' && ''}
                {useCase.category === 'qa' && ''}
                {useCase.category === 'reputation' && ''}
                {useCase.category === 'referrals' && ''}
                {useCase.category === 'verification' && ''}
                {useCase.category === 'fraud' && ''}
                {useCase.category === 'oracle' && ''}
                {useCase.category === 'moderation' && ''}
                {useCase.category === 'business' && ''}
                {useCase.category === 'voting' && ''}
                {useCase.category === 'trading' && ''}
                {useCase.category === 'predictions' && ''}
                {useCase.category === 'tooling' && ''}
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{useCase.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">{useCase.description}</p>
            
            <div className="space-y-6 flex-1">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <span className="text-purple-500 dark:text-purple-400 mr-2">•</span>
                  Examples
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  {useCase.examples.slice(0, 3).map((example, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <span className="text-purple-500 dark:text-purple-400 mr-3 mt-1">◦</span>
                      <span className="leading-relaxed">{example}</span>
                    </li>
                  ))}
                  {useCase.examples.length > 3 && (
                    <li className="text-sm text-gray-500 dark:text-gray-500 italic">
                      +{useCase.examples.length - 3} more examples...
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  Key Benefits
                </h4>
                <div className="flex flex-wrap gap-2">
                  {useCase.benefits.map((benefit, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <span className="text-blue-500 dark:text-blue-400 mr-2"></span>
                  SDK Features
                </h4>
                <div className="flex flex-wrap gap-2">
                  {useCase.sdkFeatures.map((feature, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">Ready to Build?</h3>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          Start building your own decentralized application using the Intuition SDK. 
          Each use case above demonstrates how atoms, triples, and vaults can be combined 
          to create powerful, verifiable, and monetizable knowledge systems.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-full">Atoms for Data</span>
          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm rounded-full">Triples for Relationships</span>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm rounded-full">Vaults for Monetization</span>
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-sm rounded-full">IPFS for Storage</span>
        </div>
      </div>
    </div>
  )
}