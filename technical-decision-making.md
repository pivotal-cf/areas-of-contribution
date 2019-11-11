<!--- This file was GENERATED.  Do not edit it directly.  Instead, edit the corresponding YAML file --->
## Technical Decision-Making

Ability to weigh several factors when making technical decisions. Some factors that could be considered are:

  - maintainability
  - security implications
  - performance implications
  - effects on downstream consumers
  - extensibility
  - adaptability of system / cost of change
  - support

One example of success in this area: You have been noticing a lot of bugs arising the output of <command 1> and <command 2>. Additionally, you often see stories in the backlog around adding the same sort of features to both commands. You look through the code and notice that even though both commands are following separate code paths they are trying to accomplish roughly similar things. You share your findings with the team, and embark on a path to explore how to have both commands to follow similar code paths. After coming up with a plan, you get buy-in from your PM and other engineers to do this refactor as part of a larger epic. While you do this refactor you consider the maintainability and longer term extensibility of the system while you consolidate these paths. Finally, over time you observe that the number of bugs around those 2 commands decrease, and the team feels more comfortable navigating around that part of the codebase.

---

<table>
<tbody>

<thead>
<td>Level</td><td>Skills</td>
</thead>

<tr>
<td><strong>P1</strong></td>
<td valign="top"><ul>
  <li>Makes technical decisions, resulting in features that work to complete a story.</li>

  <li>Follows along with their pair and report to other teammates on the reasons for certain technical decisions.</li>

  <li>Observes and follows existing patterns/practices on the team.</li>
</ul></td>
</tr>

<tr>
<td><strong>P2</strong></td>
<td valign="top"><ul>
  <li>Surfaces and discusses various factors (listed above in the skill area description) when approaching a technical decision, with support from other pivots to make the final decision.</li>

  <li>Makes sound technical decisions that conform to the team's existing architecture or vision.</li>
</ul></td>
</tr>

<tr>
<td><strong>P3</strong></td>
<td valign="top"><ul>
  <li>Factors in maintenance (e.g. impact on feedback loops, onboarding new contributors) as parameter when making technical decisions.</li>

  <li>Factors in support as parameter when making technical decisions</li>

  <li>Factors in performance as a parameter when making technical decisions</li>

  <li>Factors in extensibility as parameter when making technical decisions</li>

  <li>Factors in security as parameter when making technical decisions</li>

  <li>Factors in cost of change as a parameter when making technical decisions</li>

  <li>Able to recognize risks of their proposed approaches when there are underlying unknowns; able to work with PM/leadership/experienced engineers to mitigate the risks and make a technical decision that moves the team forward</li>

  <li>Able to recognize when new information emerges that requires changes in existing technical design; able to work with PM/leadership/experienced engineers to adapt existing technical decisions to the new information</li>
</ul></td>
</tr>

<tr>
<td><strong>P4</strong></td>
<td valign="top"><ul>
  <li>Takes an outcome-oriented mindset to technical decision-making.</li>

  <li>Can articulate the tradeoffs and parameters (with priorities) that drove a technical decision</li>

  <li>Bring others along on the decision-making journey, and teaches team members how to prioritize approaches and weigh-in several factors</li>

  <li>Able to change course on decisions readily (in attitude) and easily (in artifacts produced) as new information emerges</li>

  <li>Able to navigate uncertainty in underlying technical choices when making technical decisions</li>

  <li>Able to explore options and make technical decisions (without painting project in the corner) when there are unknowns in the domain</li>
</ul></td>
</tr>



</tbody></table>
