import { Link, useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LEGAL_DOCS, getLegalDoc, LAST_UPDATED, SUPPORT_EMAIL } from '../lib/legal';

export default function Legal() {
  const { slug } = useParams<{ slug: string }>();
  const doc = getLegalDoc(slug);

  if (!doc) {
    return (
      <Layout title="Legal">
        <p className="text-slate-400">We couldn’t find that document.</p>
        <ul className="mt-6 space-y-2">
          {LEGAL_DOCS.map((item) => (
            <li key={item.slug}>
              <Link to={`/legal/${item.slug}`} className="text-cyan hover:underline">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </Layout>
    );
  }

  return (
    <Layout title={doc.title}>
      <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-slate-500">
        Last updated {LAST_UPDATED}
      </p>
      <p className="mt-3 text-[15px] leading-7 text-slate-300">{doc.summary}</p>

      <div className="mt-10 space-y-9">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold text-white">{section.heading}</h2>
            <div className="mt-2 space-y-3">
              {section.body.map((paragraph, i) => (
                <p key={i} className="text-[15px] leading-7 text-slate-400">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 border-t border-line pt-6">
        <p className="text-sm text-slate-400">
          Questions about this document? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-cyan hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <nav aria-label="Other legal documents" className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {LEGAL_DOCS.filter((item) => item.slug !== doc.slug).map((item) => (
            <Link key={item.slug} to={`/legal/${item.slug}`} className="text-[13px] text-slate-400 hover:text-white">
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </Layout>
  );
}

function Layout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-slate-200">
      <Navbar />
      <main id="main" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <FileText className="h-6 w-6 text-cyan" aria-hidden="true" />
          <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}
