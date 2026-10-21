create policy "conversation_messages_update_own"
on public.conversation_messages
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
