import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen, Clock3, MapPinned, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const featuredPost = {
  title: 'How to inspect a rental property in Lagos without missing the details that cost money later',
  excerpt:
    'A practical guide to checking water supply, power backup, drainage, access roads, compound security, and landlord expectations before you commit.',
  category: 'Inspection Guide',
  readTime: '7 min read',
}

const articles = [
  {
    title: 'What annual rent really means for your budget in Abuja, Lekki, and Ibadan',
    excerpt: 'Plan beyond the headline rent by accounting for agency fees, service charges, caution, and moving costs.',
    category: 'Budgeting',
    image: '/blog/blog-topic-1.png',
  },
  {
    title: 'Questions every Nigerian tenant should ask before paying for a viewing or securing a flat',
    excerpt: 'Use a tighter screening checklist to avoid false urgency, duplicate listings, and unclear property terms.',
    category: 'Tenant Safety',
    image: '/blog/blog-topic-2.png',
  },
  {
    title: 'Best areas for young professionals who want shorter commutes and stable utilities',
    excerpt: 'A location-first look at neighborhoods where convenience matters as much as rent.',
    category: 'Neighborhoods',
    image: '/blog/blog-topic-4.png',
  },
  {
    title: 'Student housing checklist for UI, UNILAG, and private campuses',
    excerpt: 'What students and guardians should verify around security, distance, shared services, and landlord rules.',
    category: 'Student Living',
    image: '/blog/blog-topic-4.png',
  },
  {
    title: 'Furnished vs semi-furnished apartments in Nigeria: which actually saves money?',
    excerpt: 'The answer changes depending on your stay duration, city, and how much setup stress you can absorb.',
    category: 'Decision Guide',
    image: '/blog/blog-topic-2.png',
  },
  {
    title: 'What makes a listing feel trustworthy online and what should make you pause',
    excerpt: 'Clear photos, precise area information, honest amenities, and consistent contact flow tell you a lot before inspection day.',
    category: 'Trust Signals',
    image: '/blog/blog-topic-1.png',
  },
]

const principles = [
  {
    icon: ShieldCheck,
    title: 'Less marketplace fluff',
    description: 'We replaced vague sales language with guidance renters can actually use on inspection day.',
  },
  {
    icon: MapPinned,
    title: 'Local market context',
    description: 'Content reflects Nigerian locations, rent structures, and neighborhood tradeoffs instead of imported UK assumptions.',
  },
  {
    icon: BookOpen,
    title: 'Decision support',
    description: 'Every article is written to help someone compare options, ask smarter questions, and avoid costly mistakes.',
  },
]

const visualStories = [
  {
    title: 'Neighborhood fit matters',
    description: 'Choose areas that balance rent, commute, and daily convenience.',
    image: '/hero/img-a2.png',
  },
  {
    title: 'Inspect the actual living quality',
    description: 'Look beyond polished photos and focus on utilities, access, and upkeep.',
    image: '/hero/img-a1.png',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_34%,#f8fafc_100%)]">
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-slate-950 px-5 py-8 text-white shadow-[0_28px_100px_-44px_rgba(15,23,42,0.75)] sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">Renting Insights</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Nigeria-first renting advice for people who want better housing decisions.</h1>
              <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
                This blog is designed around the realities of renting in Nigeria, from annual payment expectations to inspection day red flags.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full bg-blue-500 hover:bg-blue-400 sm:w-auto">
                  <Link href="/search">Explore Listings</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="w-full text-slate-950 sm:w-auto">
                  <Link href="/booking">Book a Viewing</Link>
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur">
              <div className="relative h-56 sm:h-64">
                <Image
                  src="/hero/img-a5.png"
                  alt="Premium apartment exterior"
                  fill
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
              </div>
              <div className="p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">{featuredPost.category}</p>
                <h2 className="mt-3 text-xl font-semibold leading-snug sm:text-2xl">{featuredPost.title}</h2>
                <p className="mt-4 text-slate-300">{featuredPost.excerpt}</p>
                <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
                  <Clock3 className="h-4 w-4" />
                  {featuredPost.readTime}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
          {visualStories.map((story) => (
            <div key={story.title} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="relative h-56 sm:h-64">
                <Image src={story.image} alt={story.title} fill sizes="(max-width: 1024px) 100vw, 560px" className="object-cover" />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-slate-950">{story.title}</h2>
                <p className="mt-3 text-slate-600">{story.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {principles.map((principle) => {
            const Icon = principle.icon
            return (
              <div key={principle.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">{principle.title}</h3>
                <p className="mt-3 text-slate-600">{principle.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-blue-600">Latest Topics</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Sharper content for renters, movers, and families.</h2>
            </div>
            <p className="max-w-xl text-slate-600">
              The design inspiration may have started elsewhere, but the content here is intentionally adapted for Nigerian rental behavior and priorities.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <article key={article.title} className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-52">
                  <Image src={article.image} alt={article.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-600">{article.category}</p>
                  <h3 className="mt-4 text-xl font-semibold leading-snug text-slate-950 sm:text-2xl">{article.title}</h3>
                  <p className="mt-4 flex-1 text-slate-600">{article.excerpt}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-950">
                    Read article
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-8 text-white sm:px-8 sm:py-10 lg:grid-cols-[1fr_320px] lg:items-center lg:px-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Need more than advice? Turn your shortlist into an inspection plan.</h2>
            <p className="mt-3 text-blue-50">
              Once a property looks promising, book a viewing and organize your questions before you spend time and money.
            </p>
            <div className="mt-6">
              <Button asChild size="lg" variant="secondary" className="w-full text-blue-700 sm:w-auto">
                <Link href="/booking">Start Booking</Link>
              </Button>
            </div>
          </div>

          <div className="relative h-64 overflow-hidden rounded-[28px] border border-white/20">
            <Image
              src="/blog/blog-topic-4.png"
              alt="Comfortable apartment interior for booking call to action"
              fill
              sizes="(max-width: 1024px) 100vw, 320px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
          </div>
        </div>
      </section>
    </div>
  )
}
