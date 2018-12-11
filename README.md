# ember-data-shutdown-bug

This repo contains as minimal of a reproduction as I could get for
[this](https://github.com/emberjs/data/issues/5795) Ember Data issue that I
encountered while upgrading to Ember Data 3.5.

## Running

This project contains two tests, one that demonstrates the issue as I discovered
it (`destroy owner`), and one with my minimal repro (`unload out of order`). Run
`yarn test` to see them both fail. (It turns out that the tests pollute each
other when failing, so `yarn test` does some trickery to run both tests, but in
separate browser instances, to get accurate results).

## Overview of what happens

The basic mechanism of the failure is dematerializing two records in the reverse
order that they appear in the `RecordArray` returned from `peekAll()` while they
are being observed by an `ember-awesome-macros` array macro.

The `unload out of order` test does this by just calling `unloadRecord()` in the
proper order. The `destroy owner` test does this by populating the second
record's `belongsTo` relationship with an already-loaded `other` record, so
while destroying the container, the `other` record is dematerialized first,
which causes the second `thing` record to be dematerialized because of its
inverse relationship, and only after than is the first `thing` record
dematerialized.

This specific order causes the array macro to recompute at such a time when it
finds a `null` entry in the `RecordArray` it is observing, which causes it to
throw an exception.

## What I figured out myself

### ember-awesome-macros

I was unable to reproduce this using a `computed.sort` and `computed.filterBy`,
I've only been able to get it to happen using `ember-awesome-macros`.

### sequence of events

Dematerializing the second `thing` record first puts the two `thing` records in
their `RecordArrayManager`'s `_pending` array in reverse order. Then
`RecordArray._removeInternalModels()` calls `removeObjects()` on its proxied
`content` array, and `removeObjects()` removes objects in the reverse of the
order in which they were passed in. Because the records in the `_pending` array
were reversed, this means that `removeObjects` is removing them in the order
they appear in the array, rather than the reverse.

The first `thing` is removed from the `RecordArray` which triggers its
`ArrayProxy._arrangedContentArrayDidChange`, which sets its dirty index to zero,
and then calls `arrayContentDidChange`. I *think* that this causes array
observers supporting the computed macro to remove themselves from the remaining
items in the `RecordArray`, which results in an `objectAt(0)` call, which
(since the dirty index is now zero), causes the `RecordArray` (as an
`ArrayProxy`) to re-fetch the second `thing`, which calls
`RecordArray.objectAtContent()`, which returns `internalModel.getRecord()`,
which is `null` because the record has already been dematerialized.

The result is that the `RecordArray` contains a single element which is `null`,
and when a bunch of other observer callbacks fire causing the computed macro to
re-compute itself, it finds `null` in the array, tries to call `get('key')` on
it and throws an exception.

### fixes?

Although I was unable to reproduce this using `Ember.computed.sort` and
`Ember.computed.filterBy`, it doesn't seem like `ember-awesome-macros` is doing
anything wrong -- I think it's Ember Data mis-using the
`RecordArray`/`ArrayProxy`. While the assertion would be prevented by ensuring
that `RecordArray._removeInternalModels()` passes the records to
`removeObjects()` in the same order in which they are present in the
`RecordArray`, that seems like a brittle solution.

The real problem seems to be that after the records are already dematerialized,
removing them from the `RecordArray` isn't atomic with respect to firing off
notifications, so listeners might try to access the array while it still
contains dematerialized records. Maybe a solution would be to get a copy of the
content of the `RecordArray` as a native Javascript array, remove all records
that need to be removed, then use that resulting array to replace the content of
the `RecordArray`? I'm kinda out of my depth here, though, but hopefully this
has all been helpful. Also, observers suck :(

### Ember 3.4 vs. 3.5

I mentioned that I encountered this bug while upgrading to Ember Data 3.5. The
core issue goes back at least until Ember Data 3.0. However, something changed
between 3.4 and 3.5 such that the destroy owner test started failing. Run
`ember try:each` to see unload test fail on 3.0, 3.4 and 3.5, but the destroy
owner test fail only on 3.5.

It looks like this is happening because in 3.5, while destroying the owner, the
`other` record is dematerialized first, and its inverse relationship causes the
second `thing` record to be dematerialized as a side-effect, making it happen
before the first `thing` record is dematerialized.
