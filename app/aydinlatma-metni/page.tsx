import {LegalPage} from '@/components/legal-page'
import {legalPages} from '@/lib/legal-pages'

export default function DisclosurePage() {
  return <LegalPage content={legalPages['aydinlatma-metni']}/>
}
