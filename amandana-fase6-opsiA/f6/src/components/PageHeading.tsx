import { MiniLabel } from "@/components/MiniLabel"

export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="mb-7">
      <MiniLabel>{eyebrow}</MiniLabel>
      <h1 className="mb-2 mt-2 text-[27px] font-extrabold tracking-[-0.5px] md:text-[32px]">
        {title}
      </h1>
      <p className="max-w-xl text-[13px] leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
