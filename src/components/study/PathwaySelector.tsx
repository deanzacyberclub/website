import Toggle from '@/components/Toggle'

interface PathwaySelectorProps {
  activePathway: 'security-plus' | 'professional-ethical-hacker'
  onPathwayChange: (pathway: 'security-plus' | 'professional-ethical-hacker') => void
}

function PathwaySelector({ activePathway, onPathwayChange }: PathwaySelectorProps) {
  return (
    <div className="flex justify-center">
      <Toggle
        isActive={activePathway === 'professional-ethical-hacker'}
        onToggle={(value) =>
          onPathwayChange(value ? 'professional-ethical-hacker' : 'security-plus')
        }
        leftLabel="Security+"
        rightLabel="PEH"
      />
    </div>
  )
}

export default PathwaySelector
