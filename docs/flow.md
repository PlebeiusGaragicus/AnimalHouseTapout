# conversational flow

/start
"Welcome to the Tapout Bot! Enter the password:"
>Mel's mom

"That's wrong - try again.  I will ban you after ${} failed attempts."
>asdf

"Talk to the hand ✋🏻 you are banned!"


"What unit are you working on today?"
>E3

/stop
"Done - no longer notifyting you for tapouts on ${}."

# user database entry

```json
{
    user_chat_id: 123456789,
    unit: "E3",
}
```
