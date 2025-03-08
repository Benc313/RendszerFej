using Backend.Model;

namespace Backend.Messages;

public class RoomResponse
{
	public int Id { get; set; }
	public int Seats { get; set; }
	public string Name { get; set; }

	public RoomResponse(Terem room)
	{
		Id = room.Id;
		Seats = room.Seats;
		Name = room.Room;
	}
}