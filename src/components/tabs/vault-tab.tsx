'use client'

import { useState } from 'react'

export function UseCasesTab() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const useCases = [
    {
      category: 'knowledge-management',
      title: 'Knowledge Management Systems',
      description: 'Build decentralized knowledge bases for organizations, research institutions, and communities.',
      examples: [
        'Academic research collaboration platforms',
        'Corporate knowledge repositories',
        'Open-source documentation systems',
        'Expert knowledge sharing networks'
      ],
      benefits: ['Immutable knowledge storage', 'Community-driven curation', 'Monetization through vaults'],
      sdkFeatures: ['Atom creation', 'Triple relationships', 'IPFS integration']
    },
    {
      category: 'ai-training',
      title: 'AI Training & Data Curation',
      description: 'Create structured datasets for AI training with verifiable provenance and quality assurance.',
      examples: [
        'Training data marketplaces',
        'AI model validation datasets',
        'Quality-controlled data lakes',
        'Federated learning datasets'
      ],
      benefits: ['Provenance tracking', 'Quality verification', 'Monetized data sharing'],
      sdkFeatures: ['Structured data atoms', 'Relationship mapping', 'IPFS storage']
    },
    {
      category: 'social-networks',
      title: 'Decentralized Social Networks',
      description: 'Build social platforms where users own their data and relationships.',
      examples: [
        'Professional networking platforms',
        'Interest-based communities',
        'Content curation networks',
        'Reputation systems'
      ],
      benefits: ['User data ownership', 'Interoperable profiles', 'Monetized content'],
      sdkFeatures: ['User profile atoms', 'Relationship triples', 'Content vaults']
    },
    {
      category: 'marketplaces',
      title: 'Knowledge Marketplaces',
      description: 'Create platforms for buying, selling, and trading knowledge assets.',
      examples: [
        'Expert consultation platforms',
        'Educational content marketplaces',
        'Research data exchanges',
        'Skill verification systems'
      ],
      benefits: ['Direct monetization', 'Quality incentives', 'Transparent pricing'],
      sdkFeatures: ['Vault monetization', 'Share trading', 'Quality scoring']
    },
    {
      category: 'governance',
      title: 'Decentralized Governance',
      description: 'Build transparent and verifiable governance systems for DAOs and organizations.',
      examples: [
        'DAO proposal systems',
        'Voting mechanisms',
        'Policy documentation',
        'Decision tracking'
      ],
      benefits: ['Transparent governance', 'Immutable records', 'Community participation'],
      sdkFeatures: ['Policy atoms', 'Decision triples', 'Vote tracking']
    },
    {
      category: 'supply-chain',
      title: 'Supply Chain Transparency',
      description: 'Track products and materials through their entire lifecycle with verifiable data.',
      examples: [
        'Product origin tracking',
        'Sustainability verification',
        'Quality assurance systems',
        'Compliance documentation'
      ],
      benefits: ['End-to-end transparency', 'Fraud prevention', 'Quality assurance'],
      sdkFeatures: ['Product atoms', 'Process triples', 'Certification vaults']
    },
    {
      category: 'healthcare',
      title: 'Healthcare Data Management',
      description: 'Secure and verifiable healthcare data systems with patient control.',
      examples: [
        'Medical record systems',
        'Clinical trial data',
        'Drug safety databases',
        'Patient consent management'
      ],
      benefits: ['Patient data control', 'Regulatory compliance', 'Research collaboration'],
      sdkFeatures: ['Medical atoms', 'Treatment triples', 'Consent vaults']
    },
    {
      category: 'education',
      title: 'Educational Platforms',
      description: 'Create decentralized learning systems with verifiable credentials and content.',
      examples: [
        'Credential verification systems',
        'Open educational resources',
        'Skill assessment platforms',
        'Learning path tracking'
      ],
      benefits: ['Verifiable credentials', 'Open access', 'Quality assurance'],
      sdkFeatures: ['Credential atoms', 'Learning triples', 'Assessment vaults']
    }
  ]

  const categories = [
    { id: 'all', name: 'All Use Cases' },
    { id: 'knowledge-management', name: 'Knowledge Management' },
    { id: 'ai-training', name: 'AI & Data' },
    { id: 'social-networks', name: 'Social Networks' },
    { id: 'marketplaces', name: 'Marketplaces' },
    { id: 'governance', name: 'Governance' },
    { id: 'supply-chain', name: 'Supply Chain' },
    { id: 'healthcare', name: 'Healthcare' },
    { id: 'education', name: 'Education' }
  ]

  const filteredUseCases = selectedCategory === 'all' 
    ? useCases 
    : useCases.filter(useCase => useCase.category === selectedCategory)

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Real-World Use Cases</h2>
        <p className="text-gray-600">
          Discover how the Intuition SDK can be used to build powerful decentralized applications across various industries.
        </p>
      </div>

      {/* Category Filter */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Filter by Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Use Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredUseCases.map((useCase, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{useCase.title}</h3>
            <p className="text-gray-600 mb-4">{useCase.description}</p>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Examples:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {useCase.examples.map((example, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Benefits:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {useCase.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">SDK Features Used:</h4>
                <div className="flex flex-wrap gap-2">
                  {useCase.sdkFeatures.map((feature, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Ready to Build?</h3>
        <p className="text-blue-700 mb-4">
          Start building your own decentralized application using the Intuition SDK. 
          Each use case above demonstrates how atoms, triples, and vaults can be combined 
          to create powerful, verifiable, and monetizable knowledge systems.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">Atoms for Data</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">Triples for Relationships</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">Vaults for Monetization</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">IPFS for Storage</span>
        </div>
      </div>
    </div>
  )
} 