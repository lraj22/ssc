# Contributing to SSC

Did you find a bug? Is there a feature you want to request? Do you have some code you think would be good to add?

**Bugs**: [Open an issue][new issue] in the GitHub with a *title and clear description* that describes the bug in detail and the steps to reproduce it.

**Feature request**: [Open an issue][new issue] and add "Feature request" to the title. Be specific and reasonable, and please understand that not every request can or will be completed!

**Code contribution**: Clone this repository, make changes on your own branch, and [submit a pull request][new pull request]. Please note the following:
- If you update any `src/` JavaScript file, make sure to update `all.min.js`. You will need the [Google Closure Compiler][closure compiler] to create the bundle. The command below should do the trick. (Important note: `sw.js` is not part of the bundle)

```
google-closure-compiler lib/**.js src/**.js --js_output_file all.min.js
```
- Be aware of the performance impacts any new code may have. Please complete your own testing (including functionality testing, performance testing, etc.) before opening a pull request.

And above all, be kind. Everyone here is human. Patience and cooperation are key!

Thanks for stopping by! If you have questions, feel free to send them my way ([@lraj22][lraj22]).

[new issue]: https://github.com/lraj22/ssc/issues/new/choose
[new pull request]: https://github.com/lraj22/ssc/compare
[closure compiler]: https://github.com/google/closure-compiler
[lraj22]: https://github.com/lraj22
