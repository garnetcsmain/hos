# User Review: HOS-2026-015

## My Recommendation
🟡 RESHAPE — the framework is almost entirely back-office and invisible to me, which is FINE,
*except* for the two pieces that actually touch a frightened person's trust: coordinator MFA
and the closed search oracle. Ship those, and give me one plain-language sentence I can be told
about how my information is protected. Don't let "NIST/FIPS-aligned" become something a
coordinator says to me that sounds like a promise and isn't.

## User Scenario
I'm María. My 19-year-old son didn't come home after a protest three days ago. I'm on a cheap
Android with 2 GB of data for the month, scared, and I do not know who to trust — the last thing
I read said the government has an app that neighbors use to report people. I have heard that
"the internet is not safe." I am about to type my son's name into a website a volunteer gave me.
In the next ten minutes I need one thing: to find out if he is safe *without* my search itself
putting him — or me — in more danger.

I will never read the words "NIST," "FIPS 199," "AAL2," or "CSF 2.0." They mean nothing to me.
What I feel is: *can typing his name here get him found by the wrong people?*

## Does This Solve It?
- **Pain addressed:** PARTIAL. Most of this proposal (crypto standard, TLS cert, 800-53 control
  list, categorization) is real and I'm glad someone does it, but it is invisible to me — it
  protects me without me knowing, which is correct but not *trust-building*. Two pieces are
  different because I can feel them:
  - **The closed search oracle** (already HOS-008 work, re-labeled here): before, typing my son's
    name could let a stranger confirm he exists in the system. Now it can't — only someone who
    already holds his case number can. **This one I can be told about, and it changes whether I dare
    to search.** This is the single most trust-relevant thing in the packet, and it's already done.
  - **Coordinator MFA:** the person who can see my son's full record, his location, my phone number —
    they now need a second factor to log in. I don't know what "AAL2" is, but "the person who sees
    your son's details can't be impersonated by someone who just guessed a password" is something I
    understand and that matters to me.
- **Would I use it:** MAYBE → YES *if* someone tells me, in Spanish, in one sentence, what protects
  me. Silent back-office security does not move a frightened person from "maybe" to "yes." A plain
  promise does.

## Friction Points
1. **Nothing here talks to me.** The whole proposal is written for funders and engineers. → I need
   the one user-facing artifact the HOS-008 judge already asked for: a plain-language line at the
   search box — *"Solo alguien que ya tiene el número de caso puede confirmar que esta persona está
   aquí. Tu búsqueda no la puede exponer."* ("Only someone who already has the case number can
   confirm this person is here. Your search cannot expose them.") The security is worthless to me if
   I'm too scared to use the tool because no one told me it's safe.
2. **The word "aligned" could hurt me.** If a coordinator or a poster tells me the system is
   "NIST/FIPS secure," I might believe my son's data is safe from *everyone* — including the
   government everyone is afraid of. The proposal itself admits it is NOT safe against that. If that
   gap ever reaches me as a false promise, and my son is exposed anyway, the betrayal is total. →
   Whatever HOS tells a *user*, it must never overstate. "We collect as little as possible and we
   never confirm someone is here to a stranger" is true and I can trust it. "We are NIST-secure" is
   a phrase that could lie to me. Keep the framework name away from user-facing copy entirely.
3. **MFA on a shared shelter device.** The volunteer registering "found" people works on a borrowed
   phone that five people use. If coordinator MFA makes login so heavy that the overworked volunteer
   just... doesn't log in as themselves, or shares one logged-in session, then the "per-person
   attribution" the framework promises evaporates in the field. → MFA must survive the shared-device,
   fast-handoff reality (this is the HOS-010 identity-handoff requirement) or it's AAL2 on paper only.

## Missing Piece
**A "what we can tell you" statement — the minimum true thing HOS can say to a scared user in plain
Spanish.** The proposal's success criteria are all about what HOS can tell a *funder*. Not one is
about what HOS can tell *María*. That is backwards for a system whose whole reason to exist is her.
The minimum I should be able to be told, honestly:
1. *"We ask for as little about your son as possible."* (minimization — true today.)
2. *"Your search cannot let a stranger confirm he is here."* (closed oracle — true today.)
3. *"Only a verified coordinator can see his full details, and they now need two steps to log in."*
   (MFA — true once shipped.)
4. And the honest limit, if I ask: *"No app can promise safety against a government that can force
   the company hosting the data. That's why we keep so little."* — I would rather be told that than
   be lied to and find out the hard way.

Give me those four sentences and this framework has finally done something a user can feel. Leave
them out and it's a very good filing cabinet that no frightened mother will ever know exists.

## Confidence Score
**0.80** — I'm confident about what a scared user feels and needs (the oracle promise and honest
copy are decisive for adoption). Less certain about the shared-device MFA friction because I don't
know how the HOS-010 handoff design will actually feel in a shelter — that could be smooth or could
be the thing that quietly breaks attribution in the field.
